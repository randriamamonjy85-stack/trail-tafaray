import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRawStream,
  decodePDFRawStream,
} from "pdf-lib";
import { buildCertificatePdf, FICTIVE_RUNNER, MM_TO_PT } from "../pdf";
import { parseTmhPackage } from "../tmh-package";
import type { TemplateSettings } from "../validate-settings";

const PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  )
);

const latoRegular = readFileSync(
  path.join(process.cwd(), "src/lib/certificats/fixtures/Lato-Regular.ttf")
);
const latoBold = readFileSync(
  path.join(process.cwd(), "src/lib/certificats/fixtures/Lato-Bold.ttf")
);

function settings(partial: Partial<TemplateSettings> & Pick<TemplateSettings, "fields" | "fonts">): TemplateSettings {
  return {
    page_width_mm: 297,
    page_height_mm: 210,
    ...partial,
  };
}

async function pageContent(pdf: Uint8Array): Promise<string> {
  const doc = await PDFDocument.load(pdf);
  const page = doc.getPage(0);
  const contents = page.node.get(PDFName.of("Contents"));
  const looked = doc.context.lookup(contents);
  const streams: PDFRawStream[] = [];
  if (looked instanceof PDFArray) {
    for (let i = 0; i < looked.size(); i++) {
      const s = doc.context.lookup(looked.get(i));
      if (s instanceof PDFRawStream) streams.push(s);
    }
  } else if (looked instanceof PDFRawStream) {
    streams.push(looked);
  }
  return streams
    .map((s) => Buffer.from(decodePDFRawStream(s).decode()).toString("latin1"))
    .join("\n");
}

async function fontObjects(pdf: Uint8Array): Promise<string> {
  const doc = await PDFDocument.load(pdf);
  return doc.context
    .enumerateIndirectObjects()
    .map(([, obj]) => {
      if (obj instanceof PDFRawStream) return obj.dict.toString();
      if (obj instanceof PDFDict) return obj.toString();
      return "";
    })
    .join("\n");
}

function textPositions(content: string): { x: number; y: number }[] {
  const re =
    /([-+0-9.]+) ([-+0-9.]+) ([-+0-9.]+) ([-+0-9.]+) ([-+0-9.]+) ([-+0-9.]+) Tm/g;
  return [...content.matchAll(re)].map((m) => ({ x: Number(m[5]), y: Number(m[6]) }));
}

function fontSizes(content: string): number[] {
  return [...content.matchAll(/\/\S+ ([0-9.]+) Tf/g)].map((m) => Number(m[1]));
}

describe("buildCertificatePdf", () => {
  it("refuse si la police demandée n'est pas fournie", async () => {
    const res = await buildCertificatePdf({
      background: PNG,
      backgroundMime: "image/png",
      settings: settings({
        fonts: [{ family: "Lato", file: "Lato-Regular.ttf", weight: "normal" }],
        fields: [
          {
            id: "nom_complet",
            x_mm: 20,
            y_mm: 40,
            fontSize_pt: 18,
            fontFamily: "Lato",
            fontWeight: "normal",
            align: "left",
            letterSpacing: 0,
            autoShrink: false,
          },
        ],
      }),
      fonts: [],
      runner: FICTIVE_RUNNER,
    });
    expect(res.ok).toBe(false);
    expect(res.error || "").toMatch(/[Pp]olice/);
  });

  it("refuse une police illisible et un gras absent", async () => {
    const base = settings({
      fonts: [
        { family: "Lato", file: "Lato-Regular.ttf", weight: "normal" },
        { family: "Lato", file: "Lato-Bold.ttf", weight: "bold" },
      ],
      fields: [
        {
          id: "course",
          x_mm: 30,
          y_mm: 40,
          fontSize_pt: 16,
          fontFamily: "Lato",
          fontWeight: "bold",
          align: "left",
          letterSpacing: 0,
          autoShrink: false,
        },
      ],
    });
    const garbage = await buildCertificatePdf({
      background: PNG,
      backgroundMime: "image/png",
      settings: settings({
        fonts: [{ family: "Lato", file: "Lato-Regular.ttf", weight: "normal" }],
        fields: [
          {
            id: "course",
            x_mm: 30,
            y_mm: 40,
            fontSize_pt: 16,
            fontFamily: "Lato",
            fontWeight: "normal",
            align: "left",
            letterSpacing: 0,
            autoShrink: false,
          },
        ],
      }),
      fonts: [{ family: "Lato", weight: "normal", bytes: Uint8Array.from([1, 2, 3, 4]) }],
      runner: FICTIVE_RUNNER,
    });
    expect(garbage.ok).toBe(false);
    expect(garbage.error || "").toMatch(/illisible|non intégrable/i);

    const noBold = await buildCertificatePdf({
      background: PNG,
      backgroundMime: "image/png",
      settings: base,
      fonts: [{ family: "Lato", weight: "normal", bytes: latoRegular }],
      runner: FICTIVE_RUNNER,
    });
    expect(noBold.ok).toBe(false);
    expect(noBold.error || "").toMatch(/manquante|gras/i);
  });

  it("intègre Lato et place le texte selon les réglages", async () => {
    const field = {
      id: "nom_complet" as const,
      x_mm: 40,
      y_mm: 50,
      fontSize_pt: 20,
      fontFamily: "Lato",
      fontWeight: "normal" as const,
      align: "left" as const,
      letterSpacing: 0,
      autoShrink: false,
      color: "#112233",
    };
    const cfg = settings({
      fonts: [{ family: "Lato", file: "Lato-Regular.ttf", weight: "normal" }],
      fields: [field],
    });
    const res = await buildCertificatePdf({
      background: PNG,
      backgroundMime: "image/png",
      settings: cfg,
      fonts: [{ family: "Lato", weight: "normal", bytes: latoRegular }],
      runner: { ...FICTIVE_RUNNER, prenom: "AB", nom: "" },
      offsets: { nom_complet: { dx_mm: 5, dy_mm: 3 } },
    });
    expect(res.ok).toBe(true);
    const pdf = res.pdf!;
    const fonts = await fontObjects(pdf);
    expect(fonts).toMatch(/FontFile2/);
    expect(fonts).toMatch(/Lato/);
    expect(fonts).not.toMatch(/Helvetica/);

    const content = await pageContent(pdf);
    const pos = textPositions(content);
    expect(pos.length).toBeGreaterThan(0);
    const expectedX = (field.x_mm + 5) * MM_TO_PT;
    const expectedY = (210 - field.y_mm) * MM_TO_PT - 3 * MM_TO_PT;
    expect(Math.abs(pos[0].x - expectedX)).toBeLessThan(0.02);
    expect(Math.abs(pos[0].y - expectedY)).toBeLessThan(0.02);
    expect(fontSizes(content)[0]).toBe(20);
  });

  it("applique l'espacement des lettres et réduit la taille si le texte dépasse", async () => {
    const probe = await PDFDocument.create();
    const { default: fontkit } = await import("@pdf-lib/fontkit");
    probe.registerFontkit(fontkit);
    const font = await probe.embedFont(latoRegular, { subset: true });

    const spaced = await buildCertificatePdf({
      background: PNG,
      backgroundMime: "image/png",
      settings: settings({
        fonts: [{ family: "Lato", file: "Lato-Regular.ttf", weight: "normal" }],
        fields: [
          {
            id: "nom_complet",
            x_mm: 20,
            y_mm: 30,
            fontSize_pt: 18,
            fontFamily: "Lato",
            fontWeight: "normal",
            align: "left",
            letterSpacing: 2,
            autoShrink: false,
          },
        ],
      }),
      fonts: [{ family: "Lato", weight: "normal", bytes: latoRegular }],
      runner: { ...FICTIVE_RUNNER, prenom: "AB", nom: "" },
    });
    expect(spaced.ok).toBe(true);
    const positions = textPositions(await pageContent(spaced.pdf!));
    expect(positions.length).toBe(2);
    const advance = font.widthOfTextAtSize("A", 18) + 2;
    expect(Math.abs(positions[1].x - (positions[0].x + advance))).toBeLessThan(0.05);

    const shrunk = await buildCertificatePdf({
      background: PNG,
      backgroundMime: "image/png",
      settings: settings({
        fonts: [{ family: "Lato", file: "Lato-Bold.ttf", weight: "bold" }],
        fields: [
          {
            id: "nom_complet",
            x_mm: 148.5,
            y_mm: 80,
            fontSize_pt: 48,
            fontFamily: "Lato",
            fontWeight: "bold",
            align: "center",
            letterSpacing: 0,
            maxWidth_mm: 30,
            autoShrink: true,
          },
        ],
      }),
      fonts: [{ family: "Lato", weight: "bold", bytes: latoBold }],
      runner: FICTIVE_RUNNER,
    });
    expect(shrunk.ok).toBe(true);
    const fonts = await fontObjects(shrunk.pdf!);
    expect(fonts).toMatch(/Lato-Bold|LatoBold/);
    expect(fonts).toMatch(/FontFile2/);
    expect(fonts).not.toMatch(/Helvetica/);
    const size = fontSizes(await pageContent(shrunk.pdf!))[0];
    expect(size).toBeLessThan(48);
    expect(size).toBeGreaterThanOrEqual(6);
    const boldDoc = await PDFDocument.create();
    boldDoc.registerFontkit(fontkit);
    const boldFont = await boldDoc.embedFont(latoBold, { subset: true });
    const text = "Aina RABE";
    expect(boldFont.widthOfTextAtSize(text, size)).toBeLessThanOrEqual(30 * MM_TO_PT + 0.2);
    expect(boldFont.widthOfTextAtSize(text, size + 0.5)).toBeGreaterThan(30 * MM_TO_PT);
  });
});

describe("parseTmhPackage", () => {
  it("refuse le paquet si le fichier de police manque", async () => {
    const zip = new JSZip();
    zip.file(
      "reglages.json",
      JSON.stringify({
        page_width_mm: 297,
        page_height_mm: 210,
        fonts: [{ family: "Lato", file: "Lato-Regular.ttf", weight: "normal" }],
        fields: [
          {
            id: "course",
            x_mm: 10,
            y_mm: 10,
            fontSize_pt: 14,
            fontFamily: "Lato",
          },
        ],
      })
    );
    zip.file("fond.png", PNG);
    const buf = await zip.generateAsync({ type: "arraybuffer" });
    const parsed = await parseTmhPackage(buf);
    expect(parsed.ok).toBe(false);
    expect(parsed.errors.join(" ")).toMatch(/[Pp]olice/);
  });

  it("accepte un paquet avec la vraie police et produit un PDF", async () => {
    const zip = new JSZip();
    zip.file(
      "reglages.json",
      JSON.stringify({
        page_width_mm: 297,
        page_height_mm: 210,
        note: "interdite",
      })
    );
    const bad = await parseTmhPackage(await zip.generateAsync({ type: "arraybuffer" }));
    expect(bad.ok).toBe(false);

    const goodZip = new JSZip();
    goodZip.file(
      "reglages.json",
      JSON.stringify({
        page_width_mm: 297,
        page_height_mm: 210,
        fonts: [{ family: "Lato", file: "Lato-Regular.ttf", weight: "normal" }],
        fields: [
          {
            id: "Édition",
            x_mm: 20,
            y_mm: 20,
            fontSize_pt: 14,
            fontFamily: "Lato",
            align: "left",
          },
        ],
      })
    );
    goodZip.file("fond.png", PNG);
    goodZip.file("Lato-Regular.ttf", latoRegular);
    const parsed = await parseTmhPackage(await goodZip.generateAsync({ type: "arraybuffer" }));
    expect(parsed.ok).toBe(true);
    expect(parsed.fonts[0].weight).toBe("normal");
    const built = await buildCertificatePdf({
      background: parsed.background!.bytes,
      backgroundMime: parsed.background!.mime,
      settings: parsed.settings,
      fonts: parsed.fonts,
      runner: FICTIVE_RUNNER,
    });
    expect(built.ok).toBe(true);
    expect(await fontObjects(built.pdf!)).toMatch(/Lato/);
  });
});

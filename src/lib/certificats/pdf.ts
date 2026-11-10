import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { FieldSettings, TemplateSettings } from "./tmh-package";
import type { ResultRow } from "./parse-results";

const MM_TO_PT = 72 / 25.4;

export type FontBytes = { family: string; bytes: Uint8Array };

export type BuildInput = {
  background: Uint8Array;
  backgroundMime: string;
  settings: TemplateSettings;
  fonts: FontBytes[];
  runner: Pick<
    ResultRow,
    | "prenom"
    | "nom"
    | "course"
    | "temps"
    | "classement_scratch"
    | "classement_genre"
    | "classement_categorie"
    | "edition"
  >;
  /** Décalages de secours en mm (admin) */
  offsets?: Partial<Record<string, { dx_mm?: number; dy_mm?: number }>>;
};

function parseColor(c?: string) {
  if (!c || !/^#[0-9a-fA-F]{6}$/.test(c)) return rgb(0.12, 0.17, 0.25);
  const n = parseInt(c.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function fieldText(id: string, runner: BuildInput["runner"]): string {
  switch (id) {
    case "nom_complet":
      return `${runner.prenom} ${runner.nom}`.trim();
    case "course":
      return runner.course || "";
    case "temps":
      return runner.temps || "";
    case "classement": {
      const parts = [
        runner.classement_scratch ? `Scratch ${runner.classement_scratch}` : "",
        runner.classement_genre ? `Genre ${runner.classement_genre}` : "",
        runner.classement_categorie ? `Cat. ${runner.classement_categorie}` : "",
      ].filter(Boolean);
      return parts.join(" · ");
    }
    case "edition":
      return runner.edition || "";
    default:
      return "";
  }
}

/**
 * Génère un PDF A4 paysage (ou dimensions du JSON) avec fond + textes.
 * Les polices du paquet sont intégrées ; pas de substitution silencieuse.
 */
export async function buildCertificatePdf(input: BuildInput): Promise<{
  ok: boolean;
  error?: string;
  pdf?: Uint8Array;
  embeddedFonts?: string[];
}> {
  const { settings, fonts, background, backgroundMime, runner, offsets } = input;
  const pageW = settings.page_width_mm * MM_TO_PT;
  const pageH = settings.page_height_mm * MM_TO_PT;

  const doc = await PDFDocument.create();
  const page = doc.addPage([pageW, pageH]);

  try {
    const img =
      backgroundMime === "image/png"
        ? await doc.embedPng(background)
        : await doc.embedJpg(background);
    page.drawImage(img, { x: 0, y: 0, width: pageW, height: pageH });
  } catch {
    return { ok: false, error: "Impossible d'intégrer l'image de fond." };
  }

  const fontMap = new Map<string, Awaited<ReturnType<typeof doc.embedFont>>>();
  const embedded: string[] = [];
  for (const f of fonts) {
    try {
      const emb = await doc.embedFont(f.bytes, { subset: true });
      fontMap.set(f.family, emb);
      embedded.push(f.family);
    } catch {
      return {
        ok: false,
        error: `Police illisible ou non intégrable : ${f.family}. Substitution interdite.`,
      };
    }
  }

  for (const field of settings.fields) {
    const font = fontMap.get(field.fontFamily);
    if (!font) {
      return {
        ok: false,
        error: `Police manquante pour le champ ${field.id} (${field.fontFamily}).`,
      };
    }
    let text = fieldText(field.id, runner);
    if (!text) continue;

    let size = field.fontSize_pt;
    const maxW = (field.maxWidth_mm || settings.page_width_mm * 0.8) * MM_TO_PT;
    if (field.autoShrink) {
      while (size > 8 && font.widthOfTextAtSize(text, size) > maxW) {
        size -= 0.5;
      }
    }

    const dx = (offsets?.[field.id]?.dx_mm || 0) * MM_TO_PT;
    const dy = (offsets?.[field.id]?.dy_mm || 0) * MM_TO_PT;
    // JSON y_mm from top of page (TMH style) → pdf-lib from bottom
    const xCenter = field.x_mm * MM_TO_PT + dx;
    const y = pageH - field.y_mm * MM_TO_PT - dy;

    const textW = font.widthOfTextAtSize(text, size);
    let x = xCenter;
    if (field.align === "center") x = xCenter - textW / 2;
    else if (field.align === "right") x = xCenter - textW;

    page.drawText(text, {
      x,
      y,
      size,
      font,
      color: parseColor(field.color),
    });
  }

  const pdf = await doc.save();
  return { ok: true, pdf, embeddedFonts: embedded };
}

export const FICTIVE_RUNNER: BuildInput["runner"] = {
  prenom: "Aina",
  nom: "RABE",
  course: "Trail Découverte",
  temps: "01:42:18",
  classement_scratch: "12",
  classement_genre: "3",
  classement_categorie: "2",
  edition: "2026",
};

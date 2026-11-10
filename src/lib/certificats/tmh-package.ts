import JSZip from "jszip";

const MAX_ZIP_BYTES = 25 * 1024 * 1024;
const MAX_BG_BYTES = 12 * 1024 * 1024;
const MAX_FONT_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BYTES = 8 * 1024 * 1024;

const ALLOWED_EXT = new Set([
  "png",
  "jpg",
  "jpeg",
  "json",
  "ttf",
  "otf",
  "pdf",
]);

export type FieldSettings = {
  id: string; // nom_complet | course | temps | classement | edition
  x_mm: number;
  y_mm: number;
  fontSize_pt: number;
  fontFamily: string;
  fontWeight?: "normal" | "bold";
  color?: string; // #RRGGBB
  align?: "left" | "center" | "right";
  letterSpacing?: number;
  maxWidth_mm?: number;
  autoShrink?: boolean;
};

export type TemplateSettings = {
  page_width_mm: number;
  page_height_mm: number;
  fields: FieldSettings[];
  fonts?: { family: string; file: string }[];
};

export type ParsedTmhPackage = {
  ok: boolean;
  errors: string[];
  background?: { name: string; bytes: Uint8Array; mime: string };
  settings?: TemplateSettings;
  fonts: { family: string; file: string; bytes: Uint8Array }[];
  referencePdf?: { name: string; bytes: Uint8Array };
};

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function baseName(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || path;
}

export async function parseTmhPackage(buf: ArrayBuffer): Promise<ParsedTmhPackage> {
  const errors: string[] = [];
  if (buf.byteLength > MAX_ZIP_BYTES) {
    return { ok: false, errors: ["Paquet ZIP trop volumineux (max 25 Mo)."], fonts: [] };
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buf);
  } catch {
    return { ok: false, errors: ["ZIP illisible."], fonts: [] };
  }

  const files: { path: string; data: Uint8Array }[] = [];
  const names = Object.keys(zip.files);
  for (const path of names) {
    const f = zip.files[path];
    if (f.dir) continue;
    const e = ext(path);
    if (!ALLOWED_EXT.has(e)) {
      errors.push(`Fichier interdit dans le paquet : ${path}`);
      continue;
    }
    // refuse executables disguised
    if (/\.(exe|sh|bat|js|mjs|cjs|html|htm|svg)$/i.test(path)) {
      errors.push(`Type interdit : ${path}`);
      continue;
    }
    const data = new Uint8Array(await f.async("arraybuffer"));
    files.push({ path, data });
  }

  if (errors.length) return { ok: false, errors, fonts: [] };

  let background: ParsedTmhPackage["background"];
  let settings: TemplateSettings | undefined;
  let referencePdf: ParsedTmhPackage["referencePdf"];
  const fontFiles: { path: string; data: Uint8Array }[] = [];

  for (const f of files) {
    const e = ext(f.path);
    const bn = baseName(f.path);
    if (e === "json") {
      try {
        const text = new TextDecoder("utf-8").decode(f.data);
        settings = JSON.parse(text) as TemplateSettings;
      } catch {
        errors.push(`JSON de réglages invalide : ${bn}`);
      }
    } else if (e === "png" || e === "jpg" || e === "jpeg") {
      if (f.data.byteLength > MAX_BG_BYTES) {
        errors.push(`Image trop grande : ${bn}`);
      } else if (!background) {
        background = {
          name: bn,
          bytes: f.data,
          mime: e === "png" ? "image/png" : "image/jpeg",
        };
      }
    } else if (e === "ttf" || e === "otf") {
      if (f.data.byteLength > MAX_FONT_BYTES) errors.push(`Police trop grande : ${bn}`);
      else fontFiles.push({ path: bn, data: f.data });
    } else if (e === "pdf") {
      if (f.data.byteLength > MAX_PDF_BYTES) errors.push(`PDF trop grand : ${bn}`);
      else
        referencePdf = {
          name: bn,
          bytes: f.data,
        };
    }
  }

  if (!background) errors.push("Image de fond (PNG/JPG) manquante dans le paquet.");
  if (!settings) errors.push("Fichier de réglages JSON manquant.");
  if (!settings?.fields?.length) errors.push("Aucun champ défini dans les réglages.");
  if (!settings?.page_width_mm || !settings?.page_height_mm) {
    errors.push("Dimensions de page (mm) manquantes dans les réglages.");
  }

  // Fonts required by settings must be present — no substitution
  const fonts: ParsedTmhPackage["fonts"] = [];
  if (settings) {
    const needed = new Set<string>();
    for (const field of settings.fields) {
      if (field.fontFamily) needed.add(field.fontFamily);
    }
    for (const map of settings.fonts || []) {
      needed.add(map.family);
    }
    for (const family of needed) {
      const mapped = (settings.fonts || []).find((x) => x.family === family);
      const fileName = mapped?.file;
      const found = fontFiles.find(
        (ff) =>
          (fileName && ff.path.toLowerCase() === fileName.toLowerCase()) ||
          ff.path.toLowerCase().includes(family.toLowerCase().replace(/\s+/g, ""))
      );
      if (!found) {
        errors.push(
          `Police manquante ou illisible pour la famille « ${family} ». Substitution interdite.`
        );
      } else {
        fonts.push({ family, file: found.path, bytes: found.data });
      }
    }
    if (needed.size === 0 && fontFiles.length === 0) {
      errors.push("Aucune police fournie alors que le modèle en nécessite.");
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    background,
    settings,
    fonts,
    referencePdf,
  };
}

/** Réglages d'exemple pour V1 (à ajuster avec le fond réel). */
export const EXAMPLE_SETTINGS_V1: TemplateSettings = {
  page_width_mm: 297,
  page_height_mm: 210,
  fonts: [
    { family: "CertificateSans", file: "CertificateSans-Regular.ttf" },
  ],
  fields: [
    {
      id: "nom_complet",
      x_mm: 148.5,
      y_mm: 95,
      fontSize_pt: 28,
      fontFamily: "CertificateSans",
      fontWeight: "bold",
      color: "#1F2C3F",
      align: "center",
      maxWidth_mm: 220,
      autoShrink: true,
    },
    {
      id: "course",
      x_mm: 148.5,
      y_mm: 115,
      fontSize_pt: 16,
      fontFamily: "CertificateSans",
      color: "#A1532D",
      align: "center",
    },
    {
      id: "temps",
      x_mm: 148.5,
      y_mm: 130,
      fontSize_pt: 18,
      fontFamily: "CertificateSans",
      color: "#1F2C3F",
      align: "center",
    },
    {
      id: "classement",
      x_mm: 148.5,
      y_mm: 145,
      fontSize_pt: 14,
      fontFamily: "CertificateSans",
      color: "#444444",
      align: "center",
    },
    {
      id: "edition",
      x_mm: 148.5,
      y_mm: 175,
      fontSize_pt: 12,
      fontFamily: "CertificateSans",
      color: "#666666",
      align: "center",
    },
  ],
};

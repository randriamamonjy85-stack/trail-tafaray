import JSZip from "jszip";
import {
  validateTemplateSettings,
  type FontWeight,
  type TemplateSettings,
} from "./validate-settings";

const MAX_ZIP_BYTES = 25 * 1024 * 1024;
const MAX_BG_BYTES = 12 * 1024 * 1024;
const MAX_FONT_BYTES = 8 * 1024 * 1024;
const MAX_PDF_BYTES = 8 * 1024 * 1024;

const ALLOWED_EXT = new Set(["png", "jpg", "jpeg", "json", "ttf", "otf", "pdf"]);

export type {
  FieldSettings,
  FontMapEntry,
  FontWeight,
  TemplateSettings,
} from "./validate-settings";

export type ParsedFont = {
  family: string;
  file: string;
  bytes: Uint8Array;
  weight: FontWeight;
};

export type ParsedTmhPackage = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  background?: { name: string; bytes: Uint8Array; mime: string };
  settings?: TemplateSettings;
  fonts: ParsedFont[];
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
  const warnings: string[] = [];
  if (buf.byteLength > MAX_ZIP_BYTES) {
    return {
      ok: false,
      errors: ["Paquet ZIP trop volumineux (max 25 Mo)."],
      warnings,
      fonts: [],
    };
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buf);
  } catch {
    return { ok: false, errors: ["ZIP illisible."], warnings, fonts: [] };
  }

  const files: { path: string; data: Uint8Array }[] = [];
  for (const path of Object.keys(zip.files)) {
    const f = zip.files[path];
    if (f.dir) continue;
    const e = ext(path);
    if (!ALLOWED_EXT.has(e)) {
      errors.push(`Fichier interdit dans le paquet : ${baseName(path)}`);
      continue;
    }
    const data = new Uint8Array(await f.async("arraybuffer"));
    files.push({ path, data });
  }
  if (errors.length) return { ok: false, errors, warnings, fonts: [] };

  let background: ParsedTmhPackage["background"];
  let settingsRaw: unknown;
  let referencePdf: ParsedTmhPackage["referencePdf"];
  const fontFiles: { path: string; data: Uint8Array }[] = [];
  let jsonCount = 0;
  let imageCount = 0;
  let pdfCount = 0;

  for (const f of files) {
    const e = ext(f.path);
    const bn = baseName(f.path);
    if (e === "json") {
      jsonCount += 1;
      try {
        settingsRaw = JSON.parse(new TextDecoder("utf-8").decode(f.data));
      } catch {
        errors.push(`JSON de réglages invalide : ${bn}`);
      }
    } else if (e === "png" || e === "jpg" || e === "jpeg") {
      imageCount += 1;
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
      pdfCount += 1;
      if (f.data.byteLength > MAX_PDF_BYTES) errors.push(`PDF trop grand : ${bn}`);
      else referencePdf = { name: bn, bytes: f.data };
    }
  }

  if (jsonCount === 0) errors.push("Fichier de réglages JSON manquant.");
  if (jsonCount > 1) errors.push("Un seul fichier JSON de réglages est autorisé.");
  if (imageCount === 0) errors.push("Image de fond (PNG/JPG) manquante dans le paquet.");
  if (imageCount > 1) errors.push("Une seule image de fond est autorisée dans le paquet.");
  if (pdfCount > 1) errors.push("Un seul PDF de référence est autorisé dans le paquet.");
  if (pdfCount === 0) {
    warnings.push(
      "PDF de référence TMH absent : la comparaison puis la confirmation du modèle seront impossibles."
    );
  }

  let settings: TemplateSettings | undefined;
  if (settingsRaw !== undefined && jsonCount === 1) {
    const validated = validateTemplateSettings(settingsRaw);
    if (!validated.ok) errors.push(...validated.errors);
    else settings = validated.settings;
  }

  const fonts: ParsedFont[] = [];
  if (settings) {
    for (const map of settings.fonts) {
      const found = fontFiles.find(
        (ff) => ff.path.toLowerCase() === map.file.toLowerCase()
      );
      if (!found) {
        errors.push(
          `Fichier de police introuvable : ${map.file} (${map.family}, ${map.weight === "bold" ? "gras" : "normal"}). Substitution interdite.`
        );
      } else {
        fonts.push({
          family: map.family,
          file: found.path,
          bytes: found.data,
          weight: map.weight,
        });
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    background,
    settings,
    fonts,
    referencePdf,
  };
}

/** Réglages d'exemple V1. Le gras exige le fichier Bold du paquet. */
export const EXAMPLE_SETTINGS_V1: TemplateSettings = {
  page_width_mm: 297,
  page_height_mm: 210,
  fonts: [
    { family: "CertificateSans", file: "CertificateSans-Regular.ttf", weight: "normal" },
    { family: "CertificateSans", file: "CertificateSans-Bold.ttf", weight: "bold" },
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
      letterSpacing: 0,
      maxWidth_mm: 220,
      autoShrink: true,
    },
    {
      id: "course",
      x_mm: 148.5,
      y_mm: 115,
      fontSize_pt: 16,
      fontFamily: "CertificateSans",
      fontWeight: "normal",
      color: "#A1532D",
      align: "center",
      letterSpacing: 0,
      autoShrink: false,
    },
    {
      id: "temps",
      x_mm: 148.5,
      y_mm: 130,
      fontSize_pt: 18,
      fontFamily: "CertificateSans",
      fontWeight: "normal",
      color: "#1F2C3F",
      align: "center",
      letterSpacing: 0,
      autoShrink: false,
    },
    {
      id: "classement",
      x_mm: 148.5,
      y_mm: 145,
      fontSize_pt: 14,
      fontFamily: "CertificateSans",
      fontWeight: "normal",
      color: "#444444",
      align: "center",
      letterSpacing: 0,
      autoShrink: false,
    },
    {
      id: "edition",
      x_mm: 148.5,
      y_mm: 175,
      fontSize_pt: 12,
      fontFamily: "CertificateSans",
      fontWeight: "normal",
      color: "#666666",
      align: "center",
      letterSpacing: 0,
      autoShrink: false,
    },
  ],
};

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import {
  FIELD_LABELS,
  validateTemplateSettings,
  type FieldId,
  type FieldOffsets,
  type FieldSettings,
  type FontWeight,
  type TemplateSettings,
} from "./validate-settings";
import type { ResultRow } from "./parse-results";

export const MM_TO_PT = 72 / 25.4;
const MIN_SIZE_PT = 6;

export type FontBytes = {
  family: string;
  bytes: Uint8Array;
  weight?: FontWeight;
};

export type BuildInput = {
  background: Uint8Array;
  backgroundMime: string;
  settings: TemplateSettings | unknown;
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
  /** Décalages de secours en mm (admin). Positif : droite / bas. */
  offsets?: FieldOffsets;
};

function parseColor(c?: string) {
  if (!c || !/^#[0-9a-fA-F]{6}$/.test(c)) return rgb(0.12, 0.17, 0.25);
  const n = parseInt(c.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export function fieldText(id: FieldId, runner: BuildInput["runner"]): string {
  let text = "";
  switch (id) {
    case "nom_complet":
      text = `${runner.prenom} ${runner.nom}`.trim();
      break;
    case "course":
      text = runner.course || "";
      break;
    case "temps":
      text = runner.temps || "";
      break;
    case "classement": {
      const parts = [
        runner.classement_scratch ? `Scratch ${runner.classement_scratch}` : "",
        runner.classement_genre ? `Genre ${runner.classement_genre}` : "",
        runner.classement_categorie ? `Cat. ${runner.classement_categorie}` : "",
      ].filter(Boolean);
      text = parts.join(" · ");
      break;
    }
    case "edition":
      text = runner.edition || "";
      break;
    default:
      text = "";
  }
  return text.replace(/[\r\n]/g, " ");
}

/** Largeur du texte. Si letterSpacing ≠ 0, les glyphes sont posés un par un (pas de crénage). */
export function measureSpaced(
  widthOf: (text: string, size: number) => number,
  text: string,
  size: number,
  letterSpacing: number
): number {
  if (!letterSpacing) return widthOf(text, size);
  const chars = Array.from(text);
  let w = 0;
  for (const ch of chars) w += widthOf(ch, size);
  if (chars.length > 1) w += letterSpacing * (chars.length - 1);
  return w;
}

/**
 * y_mm = distance de la ligne de base depuis le haut de la page (repère TMH).
 * pdf-lib mesure y depuis le bas.
 */
export function layoutField(args: {
  pageHeightMm: number;
  field: FieldSettings;
  text: string;
  offsets?: FieldOffsets;
  measure: (text: string, size: number) => number;
}): { x: number; y: number; size: number; letterSpacing: number } {
  const { field, text, offsets, measure, pageHeightMm } = args;
  const off = offsets?.[field.id];
  const dx = (off?.dx_mm || 0) * MM_TO_PT;
  const dy = (off?.dy_mm || 0) * MM_TO_PT;
  const anchorX = field.x_mm * MM_TO_PT + dx;
  const y = pageHeightMm * MM_TO_PT - field.y_mm * MM_TO_PT - dy;
  const letterSpacing = field.letterSpacing || 0;
  let size = field.fontSize_pt;
  if (field.autoShrink && field.maxWidth_mm != null) {
    const maxW = field.maxWidth_mm * MM_TO_PT;
    let guard = 0;
    while (
      size > MIN_SIZE_PT &&
      measureSpaced(measure, text, size, letterSpacing) > maxW &&
      guard < 300
    ) {
      size = Math.round((size - 0.5) * 1000) / 1000;
      guard += 1;
    }
  }
  const textW = measureSpaced(measure, text, size, letterSpacing);
  let x = anchorX;
  if (field.align === "center") x = anchorX - textW / 2;
  else if (field.align === "right") x = anchorX - textW;
  return { x, y, size, letterSpacing };
}

function fontKey(family: string, weight: FontWeight): string {
  return `${family}::${weight}`;
}

function drawField(
  page: ReturnType<PDFDocument["addPage"]>,
  font: PDFFont,
  text: string,
  placed: { x: number; y: number; size: number; letterSpacing: number },
  color: ReturnType<typeof rgb>
) {
  if (!placed.letterSpacing) {
    page.drawText(text, {
      x: placed.x,
      y: placed.y,
      size: placed.size,
      font,
      color,
    });
    return;
  }
  let cursor = placed.x;
  for (const ch of Array.from(text)) {
    page.drawText(ch, {
      x: cursor,
      y: placed.y,
      size: placed.size,
      font,
      color,
    });
    cursor += font.widthOfTextAtSize(ch, placed.size) + placed.letterSpacing;
  }
}

/**
 * PDF aux dimensions du JSON, fond + textes.
 * Les polices du paquet sont intégrées (sous-ensemble). Jamais de police de remplacement.
 */
export async function buildCertificatePdf(input: BuildInput): Promise<{
  ok: boolean;
  error?: string;
  pdf?: Uint8Array;
  embeddedFonts?: string[];
}> {
  const validated = validateTemplateSettings(input.settings);
  if (!validated.ok) {
    return { ok: false, error: validated.errors.join(" ") };
  }
  const settings = validated.settings;
  const { fonts, background, backgroundMime, runner, offsets } = input;
  const pageW = settings.page_width_mm * MM_TO_PT;
  const pageH = settings.page_height_mm * MM_TO_PT;

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const page = doc.addPage([pageW, pageH]);

  try {
    if (backgroundMime === "image/png") {
      const img = await doc.embedPng(background);
      page.drawImage(img, { x: 0, y: 0, width: pageW, height: pageH });
    } else if (backgroundMime === "image/jpeg") {
      const img = await doc.embedJpg(background);
      page.drawImage(img, { x: 0, y: 0, width: pageW, height: pageH });
    } else {
      return { ok: false, error: "Fond PNG ou JPG uniquement." };
    }
  } catch {
    return { ok: false, error: "Impossible d'intégrer l'image de fond." };
  }

  const fontMap = new Map<string, PDFFont>();
  const embedded: string[] = [];
  for (const f of fonts) {
    const weight: FontWeight = f.weight === "bold" ? "bold" : "normal";
    const key = fontKey(f.family, weight);
    if (fontMap.has(key)) {
      return {
        ok: false,
        error: `Police en double : ${f.family} (${weight === "bold" ? "gras" : "normal"}).`,
      };
    }
    try {
      const emb = await doc.embedFont(f.bytes, { subset: true });
      fontMap.set(key, emb);
      embedded.push(`${f.family} (${weight})`);
    } catch {
      return {
        ok: false,
        error: `Police illisible ou non intégrable : ${f.family} (${weight === "bold" ? "gras" : "normal"}). Substitution interdite.`,
      };
    }
  }

  for (const field of settings.fields) {
    const font = fontMap.get(fontKey(field.fontFamily, field.fontWeight));
    if (!font) {
      return {
        ok: false,
        error: `Police manquante pour le champ ${FIELD_LABELS[field.id]} (${field.fontFamily}, ${field.fontWeight === "bold" ? "gras" : "normal"}). Substitution interdite.`,
      };
    }
    const text = fieldText(field.id, runner);
    if (!text) continue;
    const placed = layoutField({
      pageHeightMm: settings.page_height_mm,
      field,
      text,
      offsets,
      measure: (t, size) => font.widthOfTextAtSize(t, size),
    });
    try {
      drawField(page, font, text, placed, parseColor(field.color));
    } catch {
      return {
        ok: false,
        error: `Texte non intégrable pour le champ ${FIELD_LABELS[field.id]} (caractère absent de la police). Substitution interdite.`,
      };
    }
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

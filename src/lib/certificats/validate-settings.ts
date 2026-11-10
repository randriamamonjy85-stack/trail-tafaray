export type FontWeight = "normal" | "bold";

export type FieldId =
  | "nom_complet"
  | "course"
  | "temps"
  | "classement"
  | "edition";

export const FIELD_LABELS: Record<FieldId, string> = {
  nom_complet: "Nom complet",
  course: "Course",
  temps: "Temps",
  classement: "Classement",
  edition: "Édition",
};

export const FIELD_IDS: FieldId[] = [
  "nom_complet",
  "course",
  "temps",
  "classement",
  "edition",
];

export type FontMapEntry = {
  family: string;
  file: string;
  weight: FontWeight;
};

export type FieldSettings = {
  id: FieldId;
  x_mm: number;
  y_mm: number;
  fontSize_pt: number;
  fontFamily: string;
  fontWeight: FontWeight;
  color?: string;
  align: "left" | "center" | "right";
  /** Espacement ajouté entre les lettres, en points (pt). */
  letterSpacing: number;
  maxWidth_mm?: number;
  autoShrink: boolean;
};

export type TemplateSettings = {
  page_width_mm: number;
  page_height_mm: number;
  fields: FieldSettings[];
  fonts: FontMapEntry[];
};

export type FieldOffsets = Partial<
  Record<FieldId, { dx_mm: number; dy_mm: number }>
>;

const TOP_KEYS = ["page_width_mm", "page_height_mm", "fields", "fonts"] as const;
const FIELD_KEYS = [
  "id",
  "x_mm",
  "y_mm",
  "fontSize_pt",
  "fontFamily",
  "fontWeight",
  "color",
  "align",
  "letterSpacing",
  "maxWidth_mm",
  "autoShrink",
] as const;
const FONT_KEYS = ["family", "file", "weight"] as const;
const OFFSET_KEYS = ["dx_mm", "dy_mm"] as const;

const PAGE_MIN_MM = 40;
const PAGE_MAX_MM = 600;
const OFFSET_MAX_MM = 40;

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function finite(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return v;
}

function extra(obj: Record<string, unknown>, allowed: readonly string[]): string[] {
  return Object.keys(obj).filter((k) => !allowed.includes(k));
}

export function canonicalFieldId(raw: string): FieldId | null {
  const n = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const map: Record<string, FieldId> = {
    "nom complet": "nom_complet",
    course: "course",
    temps: "temps",
    classement: "classement",
    edition: "edition",
  };
  return map[n] || null;
}

export function inferFontWeight(file: string, explicit?: unknown): FontWeight | null {
  if (explicit === undefined) {
    return /bold|black|heavy|semibold|demi/i.test(file) ? "bold" : "normal";
  }
  if (explicit === "bold" || explicit === "normal") return explicit;
  return null;
}

function safeFamily(s: string): boolean {
  return s.length >= 1 && s.length <= 80 && !/[\u0000-\u001F\\/]/.test(s);
}

function safeFontFile(s: string): boolean {
  if (s.length < 5 || s.length > 120) return false;
  if (s.includes("/") || s.includes("\\") || s.includes("..")) return false;
  return /^[^/\\]+\.(ttf|otf)$/i.test(s);
}

export type ValidateResult =
  | { ok: true; settings: TemplateSettings }
  | { ok: false; errors: string[] };

export function validateTemplateSettings(raw: unknown): ValidateResult {
  const errors: string[] = [];
  if (!isObj(raw)) {
    return { ok: false, errors: ["Le JSON de réglages doit être un objet."] };
  }

  for (const k of extra(raw, TOP_KEYS)) {
    errors.push(
      `Clé inconnue « ${k} ». Clés autorisées : ${TOP_KEYS.join(", ")}.`
    );
  }

  const pageW = finite(raw.page_width_mm);
  const pageH = finite(raw.page_height_mm);
  if (pageW === null || pageW < PAGE_MIN_MM || pageW > PAGE_MAX_MM) {
    errors.push(
      `page_width_mm doit être un nombre entre ${PAGE_MIN_MM} et ${PAGE_MAX_MM}.`
    );
  }
  if (pageH === null || pageH < PAGE_MIN_MM || pageH > PAGE_MAX_MM) {
    errors.push(
      `page_height_mm doit être un nombre entre ${PAGE_MIN_MM} et ${PAGE_MAX_MM}.`
    );
  }

  if (!Array.isArray(raw.fonts) || raw.fonts.length === 0) {
    errors.push(
      "La liste fonts est obligatoire (famille, fichier, graisse). Aucune police de remplacement."
    );
  }
  if (Array.isArray(raw.fonts) && raw.fonts.length > 12) {
    errors.push("Trop de polices dans fonts (max 12).");
  }

  const fonts: FontMapEntry[] = [];
  if (Array.isArray(raw.fonts)) {
    raw.fonts.forEach((item, i) => {
      if (!isObj(item)) {
        errors.push(`fonts[${i}] doit être un objet.`);
        return;
      }
      for (const k of extra(item, FONT_KEYS)) {
        errors.push(`Clé inconnue dans fonts[${i}] : « ${k} ».`);
      }
      const family = typeof item.family === "string" ? item.family.trim() : "";
      const file = typeof item.file === "string" ? item.file.trim() : "";
      if (!safeFamily(family)) errors.push(`fonts[${i}].family invalide.`);
      if (!safeFontFile(file)) {
        errors.push(
          `fonts[${i}].file doit être un nom de fichier .ttf ou .otf, sans dossier.`
        );
      }
      const weight = inferFontWeight(file, item.weight);
      if (!weight) {
        errors.push(`fonts[${i}].weight doit être « normal » ou « bold ».`);
      }
      if (family && file && weight) {
        if (fonts.some((f) => f.family === family && f.weight === weight)) {
          errors.push(
            `Police en double pour « ${family} » (${weight === "bold" ? "gras" : "normal"}).`
          );
        } else {
          fonts.push({ family, file, weight });
        }
      }
    });
  }

  if (!Array.isArray(raw.fields) || raw.fields.length === 0) {
    errors.push("Aucun champ défini dans les réglages.");
  } else if (raw.fields.length > FIELD_IDS.length) {
    errors.push(`Trop de champs (maximum ${FIELD_IDS.length}).`);
  }

  const fields: FieldSettings[] = [];
  const seen = new Set<FieldId>();
  if (Array.isArray(raw.fields)) {
    raw.fields.forEach((item, i) => {
      if (!isObj(item)) {
        errors.push(`fields[${i}] doit être un objet.`);
        return;
      }
      for (const k of extra(item, FIELD_KEYS)) {
        errors.push(`Clé inconnue dans fields[${i}] : « ${k} ».`);
      }
      const idRaw = typeof item.id === "string" ? item.id : "";
      const id = canonicalFieldId(idRaw);
      if (!id) {
        errors.push(
          `Champ inconnu « ${idRaw || "?"} ». Autorisés : ${Object.values(FIELD_LABELS).join(", ")}.`
        );
        return;
      }
      if (seen.has(id)) {
        errors.push(`Champ en double : ${FIELD_LABELS[id]}.`);
        return;
      }
      seen.add(id);

      const x = finite(item.x_mm);
      const y = finite(item.y_mm);
      const size = finite(item.fontSize_pt);
      const family = typeof item.fontFamily === "string" ? item.fontFamily.trim() : "";
      if (x === null) errors.push(`${FIELD_LABELS[id]} : x_mm doit être un nombre.`);
      else if (pageW !== null && (x < 0 || x > pageW)) {
        errors.push(
          `${FIELD_LABELS[id]} : x_mm hors de la page (0 à ${pageW} mm).`
        );
      }
      if (y === null) errors.push(`${FIELD_LABELS[id]} : y_mm doit être un nombre.`);
      else if (pageH !== null && (y < 0 || y > pageH)) {
        errors.push(
          `${FIELD_LABELS[id]} : y_mm hors de la page (0 à ${pageH} mm).`
        );
      }
      if (size === null || size < 6 || size > 120) {
        errors.push(`${FIELD_LABELS[id]} : fontSize_pt doit être entre 6 et 120.`);
      }
      if (!safeFamily(family)) {
        errors.push(`${FIELD_LABELS[id]} : fontFamily invalide.`);
      }

      let fontWeight: FontWeight = "normal";
      if (item.fontWeight !== undefined) {
        if (item.fontWeight !== "normal" && item.fontWeight !== "bold") {
          errors.push(
            `${FIELD_LABELS[id]} : fontWeight doit être « normal » ou « bold ».`
          );
        } else fontWeight = item.fontWeight;
      }

      let align: FieldSettings["align"] = "left";
      if (item.align !== undefined) {
        if (item.align !== "left" && item.align !== "center" && item.align !== "right") {
          errors.push(`${FIELD_LABELS[id]} : align doit être left, center ou right.`);
        } else align = item.align;
      }

      let letterSpacing = 0;
      if (item.letterSpacing !== undefined) {
        const ls = finite(item.letterSpacing);
        if (ls === null || ls < -4 || ls > 20) {
          errors.push(`${FIELD_LABELS[id]} : letterSpacing doit être un nombre entre -4 et 20 (points).`);
        } else letterSpacing = ls;
      }

      let color: string | undefined;
      if (item.color !== undefined) {
        if (typeof item.color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(item.color)) {
          errors.push(`${FIELD_LABELS[id]} : color doit être #RRGGBB.`);
        } else color = item.color;
      }

      let maxWidth: number | undefined;
      if (item.maxWidth_mm !== undefined) {
        const mw = finite(item.maxWidth_mm);
        if (mw === null || mw <= 0 || (pageW !== null && mw > pageW)) {
          errors.push(
            `${FIELD_LABELS[id]} : maxWidth_mm doit être un nombre > 0 et ≤ largeur de page.`
          );
        } else maxWidth = mw;
      }

      let autoShrink = maxWidth !== undefined;
      if (item.autoShrink !== undefined) {
        if (typeof item.autoShrink !== "boolean") {
          errors.push(`${FIELD_LABELS[id]} : autoShrink doit être un booléen.`);
        } else autoShrink = item.autoShrink;
      }

      if (family && !fonts.some((f) => f.family === family && f.weight === fontWeight)) {
        errors.push(
          `Police « ${family} » (${fontWeight === "bold" ? "gras" : "normal"}) absente pour le champ ${FIELD_LABELS[id]}. Substitution interdite.`
        );
      }

      if (x !== null && y !== null && size !== null && family) {
        fields.push({
          id,
          x_mm: x,
          y_mm: y,
          fontSize_pt: size,
          fontFamily: family,
          fontWeight,
          color,
          align,
          letterSpacing,
          maxWidth_mm: maxWidth,
          autoShrink,
        });
      }
    });
  }

  if (errors.length || pageW === null || pageH === null) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    settings: {
      page_width_mm: pageW,
      page_height_mm: pageH,
      fields,
      fonts,
    },
  };
}

export function parseOffsets(
  raw: unknown
): { ok: true; offsets: FieldOffsets } | { ok: false; errors: string[] } {
  if (raw == null) return { ok: true, offsets: {} };
  if (!isObj(raw)) return { ok: false, errors: ["Décalages invalides."] };
  const errors: string[] = [];
  const offsets: FieldOffsets = {};
  for (const [k, v] of Object.entries(raw)) {
    const id = canonicalFieldId(k);
    if (!id || k !== id) {
      errors.push(`Décalage inconnu : « ${k} ».`);
      continue;
    }
    if (!isObj(v)) {
      errors.push(`Décalage invalide pour ${FIELD_LABELS[id]}.`);
      continue;
    }
    for (const kk of extra(v, OFFSET_KEYS)) {
      errors.push(`Clé inconnue dans le décalage ${FIELD_LABELS[id]} : « ${kk} ».`);
    }
    const dx = v.dx_mm === undefined ? 0 : finite(v.dx_mm);
    const dy = v.dy_mm === undefined ? 0 : finite(v.dy_mm);
    if (dx === null || dy === null) {
      errors.push(`${FIELD_LABELS[id]} : dx_mm et dy_mm doivent être des nombres.`);
      continue;
    }
    if (Math.abs(dx) > OFFSET_MAX_MM || Math.abs(dy) > OFFSET_MAX_MM) {
      errors.push(
        `${FIELD_LABELS[id]} : décalage trop grand (maximum ${OFFSET_MAX_MM} mm).`
      );
      continue;
    }
    offsets[id] = { dx_mm: dx, dy_mm: dy };
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, offsets };
}

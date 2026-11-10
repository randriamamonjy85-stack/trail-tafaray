/** Normalisation nom : minuscules, sans accents, espaces compactés. */
export function normalizeNom(s: string): string {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s\-']/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeDossard(s: string): string {
  return String(s || "").trim().replace(/^0+/, "") || String(s || "").trim();
}

export function sanitizeField(v: unknown, max = 120): string {
  let s = String(v ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim();
  const stripped = s.replace(/^[\s\t\r\n]+/, "");
  if (/^[=+\-@\t]/.test(stripped)) s = "'" + s;
  if (s.length > max) s = s.slice(0, max);
  return s;
}

export const ALLOWED_STATUTS = [
  "FINISHER",
  "DNF",
  "DNS",
  "DSQ",
  "HORS_DELAI",
] as const;

export type StatutCert = (typeof ALLOWED_STATUTS)[number];

export const REQUIRED_HEADERS = [
  "Édition",
  "Course",
  "Dossard",
  "Prénom",
  "Nom",
  "Genre",
  "Catégorie",
  "Nationalité",
  "Statut",
  "Temps",
  "Classement scratch",
  "Classement genre",
  "Classement catégorie",
] as const;

export const FORBIDDEN_HEADER_HINTS = [
  "email",
  "e-mail",
  "mail",
  "téléphone",
  "telephone",
  "phone",
  "adresse",
  "address",
  "naissance",
  "birth",
  "identité",
  "identite",
  "passeport",
  "passport",
  "urgence",
  "cin",
];

export function isForbiddenHeader(h: string): boolean {
  const n = h
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return FORBIDDEN_HEADER_HINTS.some((k) => n.includes(k));
}

export function isValidTemps(t: string): boolean {
  if (!t) return true; // vide ok si non finisher
  return /^\d{1,2}:\d{2}:\d{2}$/.test(t.trim());
}

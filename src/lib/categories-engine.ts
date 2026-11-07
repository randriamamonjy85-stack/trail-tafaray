/** Calcul de catégorie par âge (min/max), avec fallback Hors catégorie (HC). */

export type CategoryRule = {
  id?: string;
  discipline: "trail" | "vtt" | "duathlon" | string;
  code_base: string;
  label_homme: string;
  label_femme: string;
  annee_naissance_min: number;
  annee_naissance_max: number;
  age_min?: number | null;
  age_max?: number | null;
  courses_autorisees?: string[] | null;
  ordre?: number;
  actif?: boolean;
};

const COURSE_DISCIPLINE: Record<string, string> = {
  "Zaza Tafaray": "trail",
  "Trail Découverte": "trail",
  "Trail Endurance": "trail",
  "Trail Intense": "trail",
  "VTT BEKA": "vtt",
  "Duathlon Nature": "duathlon",
};

export function disciplineForCourse(course: string): string {
  return COURSE_DISCIPLINE[course] || "trail";
}

/** Parse DD/MM/YYYY → { day, month, year } ou null */
export function parseDateNaissance(input: string): { day: number; month: number; year: number } | null {
  const cleaned = String(input || "").trim();
  const m = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) return null;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  const today = new Date();
  if (d > today) return null;
  return { day, month, year };
}

/** Formate 15061995 → 15/06/1995 */
export function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Âge civil à la date de référence de l'événement.
 * Si dateRef = 25/10/2026 et naissance 15/06/1995 → 31 ans.
 * Fallback : année de référence - année de naissance.
 */
export function computeAge(
  birth: { day: number; month: number; year: number },
  referenceDate?: string | null,
  referenceYear?: number | null
): number {
  let ref = new Date();
  if (referenceDate) {
    // accept YYYY-MM-DD or ISO
    const d = new Date(referenceDate);
    if (!isNaN(d.getTime())) ref = d;
  } else if (referenceYear) {
    ref = new Date(referenceYear, 11, 31);
  }

  let age = ref.getFullYear() - birth.year;
  const m = ref.getMonth() + 1;
  const day = ref.getDate();
  if (m < birth.month || (m === birth.month && day < birth.day)) {
    age -= 1;
  }
  return age;
}

const HC_HOMME = "Hors catégorie Hommes (HC)";
const HC_FEMME = "Hors catégorie Femmes (HC)";

export function horsCategorieLabel(genre: string): string {
  return /femme|f/i.test(genre) ? HC_FEMME : HC_HOMME;
}

/**
 * Trouve la catégorie par âge min/max.
 * Si aucune règle ne correspond → Hors catégorie (HC).
 */
export function computeCategory(
  dateNaissance: string,
  genre: string,
  course: string,
  rules: CategoryRule[],
  options?: { referenceDate?: string | null; referenceYear?: number | null }
): string {
  const parsed = parseDateNaissance(dateNaissance);
  if (!parsed || !genre || !course) return "";

  const age = computeAge(parsed, options?.referenceDate, options?.referenceYear);
  const discipline = disciplineForCourse(course);
  const isFemme = /femme|f/i.test(genre);

  const candidates = rules
    .filter((r) => r.discipline === discipline && r.actif !== false)
    .filter((r) => {
      const allowed = r.courses_autorisees;
      if (!allowed || allowed.length === 0) return true;
      return allowed.includes(course);
    })
    .filter((r) => {
      // Priorité âge min/max si renseignés
      const hasAge =
        r.age_min != null &&
        r.age_min !== undefined &&
        r.age_max != null &&
        r.age_max !== undefined;
      if (hasAge) {
        return age >= Number(r.age_min) && age <= Number(r.age_max);
      }
      // Fallback années de naissance (anciennes données)
      if (r.annee_naissance_min && r.annee_naissance_max) {
        return parsed.year >= r.annee_naissance_min && parsed.year <= r.annee_naissance_max;
      }
      return false;
    })
    .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));

  const rule = candidates[0];
  if (!rule) return horsCategorieLabel(genre);

  return isFemme ? rule.label_femme : rule.label_homme;
}

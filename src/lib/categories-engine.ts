/** Calcul automatique de catégorie à partir des règles en base (années de naissance). */

export type CategoryRule = {
  id?: string;
  discipline: "trail" | "vtt" | "duathlon";
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

const COURSE_DISCIPLINE: Record<string, CategoryRule["discipline"]> = {
  "Zaza Tafaray": "trail",
  "Trail Découverte": "trail",
  "Trail Endurance": "trail",
  "Trail Intense": "trail",
  "VTT BEKA": "vtt",
  "Duathlon Nature": "duathlon",
};

export function disciplineForCourse(course: string): CategoryRule["discipline"] {
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

/**
 * Formate la saisie clavier : 15061995 → 15/06/1995
 */
export function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function computeCategory(
  dateNaissance: string,
  genre: string,
  course: string,
  rules: CategoryRule[]
): string {
  const parsed = parseDateNaissance(dateNaissance);
  if (!parsed || !genre || !course) return "";

  const discipline = disciplineForCourse(course);
  const isFemme = /femme|f/i.test(genre);

  const candidates = rules
    .filter((r) => r.discipline === discipline && r.actif !== false)
    .filter((r) => {
      const allowed = r.courses_autorisees;
      if (!allowed || allowed.length === 0) return true;
      return allowed.includes(course);
    })
    .filter(
      (r) =>
        parsed.year >= r.annee_naissance_min && parsed.year <= r.annee_naissance_max
    )
    .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));

  const rule = candidates[0];
  if (!rule) return "";

  return isFemme ? rule.label_femme : rule.label_homme;
}

/** Course autorise-t-elle cette année de naissance selon les règles ? */
export function isCourseAllowedForBirthYear(
  course: string,
  birthYear: number,
  rules: CategoryRule[]
): boolean {
  const discipline = disciplineForCourse(course);
  return rules.some(
    (r) =>
      r.discipline === discipline &&
      r.actif !== false &&
      birthYear >= r.annee_naissance_min &&
      birthYear <= r.annee_naissance_max &&
      (!r.courses_autorisees ||
        r.courses_autorisees.length === 0 ||
        r.courses_autorisees.includes(course))
  );
}

export type Inscription = {
  id: string;
  reference: string;
  prenom: string;
  nom: string;
  dateNaissance: string;
  genre: string;
  categorie: string;
  nationalite: string;
  email: string;
  telephone: string;
  adresse: string;
  organisation: string;
  tailleTee: string;
  navette: string;
  placesNavette: number;
  course: string;
  contactUrgence: string;
  telephoneUrgence: string;
  numeroIdentite: string;
  statut: "En attente" | "Validé" | "Refusé";
  creeLe: string;
  operateur?: string;
  referencePaiement?: string;
  montantDeclare?: number;
  exporte?: boolean;
  dateExport?: string;
};

export const COURSES = [
  "Zaza Tafaray",
  "Trail Découverte",
  "Trail Endurance",
  "Trail Intense",
  "VTT BEKA",
  "Duathlon Nature",
] as const;

export function coursePrefix(course: string): string {
  const prefixes: Record<string, string> = {
    "Zaza Tafaray": "TTTZT",
    "Trail Découverte": "TTTTD",
    "Trail Endurance": "TTTTE",
    "Trail Intense": "TTTTI",
    "VTT BEKA": "TTTVTT",
    "Duathlon Nature": "TTTDN",
  };
  return prefixes[course] || "TTTXX";
}

export function generateReference(course: string, sequence: number): string {
  const prefix = coursePrefix(course);
  return `${prefix}${String(sequence).padStart(5, "0")}`;
}

/** Date jj/mm/aaaa en heure Madagascar (UTC+3). */
export function formatDate(date: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Indian/Antananarivo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  // fr-FR often gives dd/mm/yyyy
  const parts = fmt.formatToParts(date);
  const d = parts.find((p) => p.type === "day")?.value || "01";
  const m = parts.find((p) => p.type === "month")?.value || "01";
  const y = parts.find((p) => p.type === "year")?.value || "2026";
  return `${d}/${m}/${y}`;
}

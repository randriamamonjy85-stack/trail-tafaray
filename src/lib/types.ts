export type Inscription = {
  id: string;
  reference: string;
  prenom: string;
  nom: string;
  dateNaissance: string; // DD/MM/YYYY
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
  creeLe: string; // DD/MM/YYYY
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

export function generateReference(course: string, sequence: number): string {
  const prefixes: Record<string, string> = {
    "Zaza Tafaray": "TTTZT",
    "Trail Découverte": "TTTTD",
    "Trail Endurance": "TTTTE",
    "Trail Intense": "TTTTI",
    "VTT BEKA": "TTTVTT",
    "Duathlon Nature": "TTTDN",
  };
  const prefix = prefixes[course] || "TTTXX";
  return `${prefix}${String(sequence).padStart(5, "0")}`;
}

export function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

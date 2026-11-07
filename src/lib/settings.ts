import { createClient } from "@/lib/supabase/server";

export type SiteSettings = {
  inscriptions_ouvertes: boolean;
  resultats_visibles: boolean;
  partenaires_visibles: boolean;
  actualites_visibles: boolean;
  hero_titre: string;
  hero_sous_titre: string;
  date_evenement: string;
  lieu_evenement: string;
  texte_evenements: string;
  texte_courses: string;
  texte_reglement: string;
  tarif_zaza: number;
  tarif_decouverte: number;
  tarif_endurance: number;
  tarif_intense: number;
  tarif_vtt: number;
  tarif_duathlon: number;
  tarif_navette: number;
  mobile_money_mvola: string;
  mobile_money_orange: string;
  mobile_money_airtel: string;
  mm_beneficiaire: string;
  mm_titulaire: string;
  mm_instructions: string;
  mm_frais_mode: string;
  mm_frais_mvola: number;
  mm_frais_orange: number;
  mm_frais_airtel: number;
  hero_image_url: string;
  tee_sizes: string;
  annee_reference_categories: number;
};

const defaults: SiteSettings = {
  inscriptions_ouvertes: true,
  resultats_visibles: false,
  partenaires_visibles: true,
  actualites_visibles: true,
  hero_titre: "Trail Tafaray",
  hero_sous_titre:
    "Une aventure qui relie les sentiers et les personnes au cœur des paysages d’Anjeva.",
  date_evenement: "2027-10-24T06:00:00+03:00",
  lieu_evenement: "Anjeva, Madagascar",
  texte_evenements: "",
  texte_courses: "",
  texte_reglement: "",
  tarif_zaza: 15000,
  tarif_decouverte: 25000,
  tarif_endurance: 35000,
  tarif_intense: 45000,
  tarif_vtt: 40000,
  tarif_duathlon: 50000,
  tarif_navette: 20000,
  mobile_money_mvola: "",
  mobile_money_orange: "",
  mobile_money_airtel: "",
  mm_beneficiaire: "Association Trail Tafaray",
  mm_titulaire: "",
  mm_instructions: "Effectuez le transfert puis indiquez la référence de transaction.",
  mm_frais_mode: "fixe",
  mm_frais_mvola: 0,
  mm_frais_orange: 0,
  mm_frais_airtel: 0,
  hero_image_url: "",
  tee_sizes: "S,M,L,XL,XXL",
  annee_reference_categories: 2026,
};

export async function getSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_settings").select("*").eq("id", 1).single();
    if (!data) return defaults;
    return { ...defaults, ...data };
  } catch {
    return defaults;
  }
}

export function getTarifs(settings: SiteSettings): Record<string, number> {
  return {
    "Zaza Tafaray": settings.tarif_zaza,
    "Trail Découverte": settings.tarif_decouverte,
    "Trail Endurance": settings.tarif_endurance,
    "Trail Intense": settings.tarif_intense,
    "VTT BEKA": settings.tarif_vtt,
    "Duathlon Nature": settings.tarif_duathlon,
  };
}

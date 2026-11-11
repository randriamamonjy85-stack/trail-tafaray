import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  filterActiveSponsors,
  type SponsorRecord,
} from "@/lib/sponsors/logic";

/** Liste publique des sponsors actifs (RLS + filtre dates côté code). */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sponsors")
      .select(
        "id,nom,image_url,site_url,date_debut,date_fin,actif,ordre,afficher_popup,afficher_bande"
      )
      .order("ordre", { ascending: true });

    if (error) {
      // Table absente avant migration : réponse vide plutôt qu'erreur 500
      return NextResponse.json({ sponsors: [] as SponsorRecord[] });
    }

    const sponsors = filterActiveSponsors((data || []) as SponsorRecord[]);
    return NextResponse.json({ sponsors });
  } catch {
    return NextResponse.json({ sponsors: [] });
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Public : résultats seulement si settings.resultats_visibles */
export async function GET() {
  const supabase = createAdminClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("resultats_visibles")
    .eq("id", 1)
    .maybeSingle();

  if (settings && settings.resultats_visibles === false) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("resultats")
    .select("id,course,categorie,position,nom,prenom,temps,club")
    .order("position", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

/** Saisie manuelle coupée. Source officielle : import TMH / GmCAP. */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "La saisie manuelle des résultats est désactivée. La source officielle est l'import TMH / GmCAP (onglet Certificats).",
    },
    { status: 410 }
  );
}

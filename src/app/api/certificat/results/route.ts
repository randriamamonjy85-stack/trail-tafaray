import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const edition = searchParams.get("edition") || "";
  if (!edition) return NextResponse.json({ error: "edition requise" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: ed } = await supabase
    .from("certificate_editions")
    .select("id,published,results_public")
    .eq("code", edition)
    .maybeSingle();

  if (!ed?.published || !ed.results_public) {
    return NextResponse.json({ error: "Résultats non publics." }, { status: 404 });
  }

  const { data } = await supabase
    .from("certificate_results")
    .select(
      "course,dossard,prenom,nom,genre,categorie,nationalite,statut,temps,classement_scratch,classement_genre,classement_categorie"
    )
    .eq("edition_id", ed.id)
    .order("course")
    .order("classement_scratch");

  return NextResponse.json(data || []);
}

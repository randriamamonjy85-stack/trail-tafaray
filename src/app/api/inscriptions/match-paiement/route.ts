import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/supabase/require-admin";

/** Colle un SMS MVola / texte : extrait des références et propose les inscriptions correspondantes. */
export async function POST(request: Request) {
  const gate = await requireAdminSession();
  if (gate.response) return gate.response;

  const { texte } = await request.json();
  const raw = String(texte || "");
  if (!raw.trim()) {
    return NextResponse.json({ error: "Texte SMS vide" }, { status: 400 });
  }

  // Extraire tokens alphanumériques susceptibles d'être des refs (4+ chars)
  const tokens = Array.from(
    new Set(
      (raw.toUpperCase().match(/[A-Z0-9]{4,}/g) || []).map((t) => t.trim())
    )
  );

  const supabase = gate.admin!;
  const { data, error } = await supabase
    .from("inscriptions")
    .select("*")
    .eq("statut", "En attente")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const matches = (data || []).filter((row: any) => {
    const ref = String(row.reference_paiement || "").toUpperCase().replace(/\s/g, "");
    if (!ref) return false;
    return tokens.some(
      (t) => ref.includes(t) || t.includes(ref) || raw.toUpperCase().includes(ref)
    );
  });

  return NextResponse.json({
    tokens,
    matches: matches.map((row: any) => ({
      id: row.id,
      reference: row.reference,
      prenom: row.prenom,
      nom: row.nom,
      course: row.course,
      referencePaiement: row.reference_paiement,
      operateur: row.operateur,
      montantDeclare: row.montant_declare,
    })),
  });
}

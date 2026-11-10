import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeDossard, normalizeNom } from "@/lib/certificats/normalize";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Recherche un seul coureur (édition publiée + dossard + nom). Pas de liste. */
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rl = rateLimit(`cert-lookup:${ip}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const editionCode = String(body.edition || "").trim();
  const dossard = normalizeDossard(String(body.dossard || ""));
  const nom = normalizeNom(String(body.nom || ""));

  if (!editionCode || !dossard || !nom) {
    return NextResponse.json(
      { error: "Édition, dossard et nom de famille sont requis." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data: ed } = await supabase
    .from("certificate_editions")
    .select("id,code,label,published")
    .eq("code", editionCode)
    .eq("published", true)
    .maybeSingle();

  if (!ed) {
    return NextResponse.json({ error: "Édition non disponible." }, { status: 404 });
  }

  const { data: row } = await supabase
    .from("certificate_results")
    .select(
      "statut,course,prenom,nom,temps,classement_scratch,classement_genre,classement_categorie,dossard"
    )
    .eq("edition_id", ed.id)
    .eq("dossard", dossard)
    .eq("nom_norm", nom)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({
      found: false,
      message: "Aucune correspondance pour ces informations.",
    });
  }

  if (row.statut !== "FINISHER") {
    return NextResponse.json({
      found: true,
      finisher: false,
      message: "Aucun certificat de finisher n'est disponible pour ce dossard.",
    });
  }

  return NextResponse.json({
    found: true,
    finisher: true,
    edition: ed.code,
    course: row.course,
    prenom: row.prenom,
    nom: row.nom,
    temps: row.temps,
    // token minimal for PDF: dossard+edition verified again server-side
    canDownload: true,
  });
}

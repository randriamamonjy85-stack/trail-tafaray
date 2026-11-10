import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeDossard, normalizeNom } from "@/lib/certificats/normalize";
import { clientIp, enforceLimits } from "@/lib/rate-limit-shared";

export const runtime = "nodejs";

/** Recherche un seul coureur (édition publiée + dossard + nom). Pas de liste. */
export async function POST(request: Request) {
  const supabase = createAdminClient();
  const ip = clientIp(request);
  const ipOk = await enforceLimits(supabase, [
    { prefix: "cert-lookup-ip-min", raw: ip, limit: 8, windowMs: 60_000 },
    { prefix: "cert-lookup-ip-hour", raw: ip, limit: 40, windowMs: 3_600_000 },
  ]);
  if (!ipOk) {
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

  const bibOk = await enforceLimits(supabase, [
    {
      prefix: "cert-lookup-bib-hour",
      raw: `${editionCode}|${dossard}`,
      limit: 20,
      windowMs: 3_600_000,
    },
  ]);
  if (!bibOk) {
    return NextResponse.json(
      { error: "Trop de tentatives pour ce dossard. Réessayez plus tard." },
      { status: 429 }
    );
  }

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
    canDownload: true,
  });
}

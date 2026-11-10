import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeDossard, normalizeNom } from "@/lib/certificats/normalize";
import { buildCertificatePdf } from "@/lib/certificats/pdf";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rl = rateLimit(`cert-pdf:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Trop de demandes." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const editionCode = String(body.edition || "").trim();
  const dossard = normalizeDossard(String(body.dossard || ""));
  const nom = normalizeNom(String(body.nom || ""));

  if (!editionCode || !dossard || !nom) {
    return NextResponse.json({ error: "Paramètres incomplets." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: ed } = await supabase
    .from("certificate_editions")
    .select("*")
    .eq("code", editionCode)
    .eq("published", true)
    .maybeSingle();

  if (!ed?.template_bg_path || !ed?.template_settings || !ed.template_confirmed) {
    return NextResponse.json({ error: "Certificat non disponible." }, { status: 404 });
  }

  const { data: row } = await supabase
    .from("certificate_results")
    .select("*")
    .eq("edition_id", ed.id)
    .eq("dossard", dossard)
    .eq("nom_norm", nom)
    .eq("statut", "FINISHER")
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ error: "Aucune correspondance." }, { status: 404 });
  }

  const { data: bgFile } = await supabase.storage.from("photos").download(ed.template_bg_path);
  if (!bgFile) return NextResponse.json({ error: "Modèle incomplet." }, { status: 500 });
  const bgBytes = new Uint8Array(await bgFile.arrayBuffer());
  const mime = ed.template_bg_path.endsWith(".png") ? "image/png" : "image/jpeg";

  const fonts: { family: string; bytes: Uint8Array }[] = [];
  for (const f of ed.template_fonts || []) {
    const { data: ff } = await supabase.storage.from("photos").download(f.path);
    if (!ff)
      return NextResponse.json({ error: "Police du modèle indisponible." }, { status: 500 });
    fonts.push({ family: f.family, bytes: new Uint8Array(await ff.arrayBuffer()) });
  }

  const built = await buildCertificatePdf({
    background: bgBytes,
    backgroundMime: mime,
    settings: ed.template_settings,
    fonts,
    runner: {
      prenom: row.prenom,
      nom: row.nom,
      course: row.course,
      temps: row.temps,
      classement_scratch: row.classement_scratch,
      classement_genre: row.classement_genre,
      classement_categorie: row.classement_categorie,
      edition: ed.code,
    },
  });

  if (!built.ok || !built.pdf) {
    return NextResponse.json({ error: built.error || "Erreur PDF" }, { status: 500 });
  }

  return new NextResponse(Buffer.from(built.pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificat-${ed.code}-${dossard}.pdf"`,
    },
  });
}

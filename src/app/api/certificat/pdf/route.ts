import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeDossard, normalizeNom } from "@/lib/certificats/normalize";
import { buildCertificatePdf } from "@/lib/certificats/pdf";
import { downloadCertBytes, loadTemplateFonts, mimeFromCertPath } from "@/lib/certificats/load-assets";
import { parseOffsets } from "@/lib/certificats/validate-settings";
import { clientIp, enforceLimits } from "@/lib/rate-limit-shared";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createAdminClient();
  const ip = clientIp(request);
  const ipOk = await enforceLimits(supabase, [
    { prefix: "cert-pdf-ip-min", raw: ip, limit: 5, windowMs: 60_000 },
    { prefix: "cert-pdf-ip-hour", raw: ip, limit: 20, windowMs: 3_600_000 },
  ]);
  if (!ipOk) {
    return NextResponse.json({ error: "Trop de demandes." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const editionCode = String(body.edition || "").trim();
  const dossard = normalizeDossard(String(body.dossard || ""));
  const nom = normalizeNom(String(body.nom || ""));

  if (!editionCode || !dossard || !nom) {
    return NextResponse.json({ error: "Paramètres incomplets." }, { status: 400 });
  }

  const bibOk = await enforceLimits(supabase, [
    {
      prefix: "cert-pdf-bib-hour",
      raw: `${editionCode}|${dossard}`,
      limit: 12,
      windowMs: 3_600_000,
    },
  ]);
  if (!bibOk) {
    return NextResponse.json({ error: "Trop de demandes pour ce dossard." }, { status: 429 });
  }

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

  const mime = mimeFromCertPath(ed.template_bg_path);
  const bgBytes = mime ? await downloadCertBytes(supabase, ed.template_bg_path) : null;
  if (!mime || !bgBytes) {
    return NextResponse.json({ error: "Modèle incomplet." }, { status: 500 });
  }

  const loaded = await loadTemplateFonts(supabase, ed.template_fonts);
  if (!loaded.ok) {
    return NextResponse.json({ error: "Police du modèle indisponible." }, { status: 500 });
  }

  const offsets = parseOffsets(ed.template_offsets ?? {});
  if (!offsets.ok) {
    return NextResponse.json({ error: "Décalages de modèle invalides." }, { status: 500 });
  }

  const built = await buildCertificatePdf({
    background: bgBytes,
    backgroundMime: mime,
    settings: ed.template_settings,
    fonts: loaded.fonts,
    offsets: offsets.offsets,
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
      "Cache-Control": "no-store",
    },
  });
}

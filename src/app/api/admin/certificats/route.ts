import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/supabase/require-admin";
import { parseResultsBuffer } from "@/lib/certificats/parse-results";
import { parseTmhPackage } from "@/lib/certificats/tmh-package";
import { buildCertificatePdf, FICTIVE_RUNNER } from "@/lib/certificats/pdf";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

/** Liste des éditions */
export async function GET() {
  const gate = await requireAdminSession();
  if (gate.response) return gate.response;
  const { data, error } = await gate.admin!
    .from("certificate_editions")
    .select("*")
    .order("code", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

/**
 * Actions admin certificats (multipart ou JSON).
 * action: create_edition | preview_results | confirm_results | rollback |
 *         upload_template_image | upload_tmh_package | confirm_template |
 *         publish | unpublish | set_results_public | preview_pdf
 */
export async function POST(request: Request) {
  const gate = await requireAdminSession();
  if (gate.response) return gate.response;
  const supabase = gate.admin!;

  const ctype = request.headers.get("content-type") || "";
  if (ctype.includes("multipart/form-data")) {
    const form = await request.formData();
    const action = String(form.get("action") || "");
    const editionId = String(form.get("edition_id") || "");

    if (action === "preview_results") {
      const file = form.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
      const buf = await file.arrayBuffer();
      const preview = parseResultsBuffer(buf, file.name);
      return NextResponse.json(preview);
    }

    if (action === "confirm_results") {
      const file = form.get("file") as File | null;
      if (!file || !editionId)
        return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
      const buf = await file.arrayBuffer();
      const preview = parseResultsBuffer(buf, file.name);
      if (!preview.ok)
        return NextResponse.json({ error: "Fichier invalide", preview }, { status: 400 });

      const { data: ed } = await supabase
        .from("certificate_editions")
        .select("*")
        .eq("id", editionId)
        .single();
      if (!ed) return NextResponse.json({ error: "Édition introuvable" }, { status: 404 });

      // Snapshot courant pour rollback
      const { data: oldRows } = await supabase
        .from("certificate_results")
        .select("*")
        .eq("edition_id", editionId);
      const newVersion = (ed.results_version || 0) + 1;

      await supabase
        .from("certificate_editions")
        .update({
          previous_snapshot: { version: ed.results_version, rows: oldRows || [] },
          results_version: newVersion,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editionId);

      await supabase.from("certificate_results").delete().eq("edition_id", editionId);

      const inserts = preview.rows.map((r) => ({
        edition_id: editionId,
        edition_code: r.edition || ed.code,
        course: r.course,
        dossard: r.dossard,
        prenom: r.prenom,
        nom: r.nom,
        nom_norm: r.nom_norm,
        genre: r.genre,
        categorie: r.categorie,
        nationalite: r.nationalite,
        statut: r.statut,
        temps: r.temps,
        classement_scratch: r.classement_scratch,
        classement_genre: r.classement_genre,
        classement_categorie: r.classement_categorie,
        import_version: newVersion,
      }));

      if (inserts.length) {
        const { error } = await supabase.from("certificate_results").insert(inserts);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await writeAudit(supabase, gate.user?.email, "cert_import_results", "edition", editionId);
      return NextResponse.json({
        success: true,
        version: newVersion,
        total: inserts.length,
        finishers: preview.finishers,
      });
    }

    if (action === "upload_tmh_package") {
      const file = form.get("file") as File | null;
      if (!file || !editionId)
        return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
      const buf = await file.arrayBuffer();
      const parsed = await parseTmhPackage(buf);
      if (!parsed.ok)
        return NextResponse.json({ error: parsed.errors.join(" "), errors: parsed.errors }, { status: 400 });

      const bucket = "photos";
      const base = `certificats/${editionId}`;

      const bgPath = `${base}/fond.${parsed.background!.mime === "image/png" ? "png" : "jpg"}`;
      await supabase.storage.from(bucket).upload(bgPath, parsed.background!.bytes, {
        contentType: parsed.background!.mime,
        upsert: true,
      });

      const fontMeta: { family: string; path: string }[] = [];
      for (const f of parsed.fonts) {
        const fp = `${base}/fonts/${f.file}`;
        await supabase.storage.from(bucket).upload(fp, f.bytes, {
          contentType: "font/ttf",
          upsert: true,
        });
        fontMeta.push({ family: f.family, path: fp });
      }

      let refPath: string | null = null;
      if (parsed.referencePdf) {
        refPath = `${base}/reference.pdf`;
        await supabase.storage.from(bucket).upload(refPath, parsed.referencePdf.bytes, {
          contentType: "application/pdf",
          upsert: true,
        });
      }

      await supabase
        .from("certificate_editions")
        .update({
          template_bg_path: bgPath,
          template_settings: parsed.settings,
          template_fonts: fontMeta,
          template_reference_pdf_path: refPath,
          template_confirmed: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editionId);

      await writeAudit(supabase, gate.user?.email, "cert_template_package", "edition", editionId);
      return NextResponse.json({ success: true, fonts: fontMeta.map((f) => f.family) });
    }

    if (action === "upload_template_image") {
      const file = form.get("file") as File | null;
      if (!file || !editionId)
        return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
      if (!/^image\/(jpeg|png)$/.test(file.type))
        return NextResponse.json({ error: "JPG ou PNG uniquement (pas de SVG)." }, { status: 400 });
      if (file.size > 12 * 1024 * 1024)
        return NextResponse.json({ error: "Image trop grande (max 12 Mo)." }, { status: 400 });
      const ext = file.type === "image/png" ? "png" : "jpg";
      const path = `certificats/${editionId}/fond.${ext}`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      await supabase.storage.from("photos").upload(path, bytes, {
        contentType: file.type,
        upsert: true,
      });
      await supabase
        .from("certificate_editions")
        .update({
          template_bg_path: path,
          template_confirmed: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editionId);
      return NextResponse.json({ success: true, path });
    }

    return NextResponse.json({ error: "Action multipart inconnue" }, { status: 400 });
  }

  // JSON body
  const body = await request.json();
  const { action, edition_id, code, label, offsets } = body;

  if (action === "create_edition") {
    if (!code) return NextResponse.json({ error: "code requis" }, { status: 400 });
    const { data, error } = await supabase
      .from("certificate_editions")
      .insert({
        code: String(code).slice(0, 20),
        label: String(label || `Édition ${code}`).slice(0, 120),
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAudit(supabase, gate.user?.email, "cert_create_edition", "edition", data.id);
    return NextResponse.json(data);
  }

  if (action === "rollback") {
    const { data: ed } = await supabase
      .from("certificate_editions")
      .select("*")
      .eq("id", edition_id)
      .single();
    if (!ed?.previous_snapshot?.rows)
      return NextResponse.json({ error: "Aucune version précédente" }, { status: 400 });
    await supabase.from("certificate_results").delete().eq("edition_id", edition_id);
    const rows = ed.previous_snapshot.rows.map((r: any) => {
      const { id, created_at, ...rest } = r;
      return { ...rest, edition_id };
    });
    if (rows.length) await supabase.from("certificate_results").insert(rows);
    await supabase
      .from("certificate_editions")
      .update({
        results_version: ed.previous_snapshot.version || 0,
        previous_snapshot: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", edition_id);
    await writeAudit(supabase, gate.user?.email, "cert_rollback", "edition", edition_id);
    return NextResponse.json({ success: true });
  }

  if (action === "confirm_template") {
    await supabase
      .from("certificate_editions")
      .update({ template_confirmed: true, updated_at: new Date().toISOString() })
      .eq("id", edition_id);
    return NextResponse.json({ success: true });
  }

  if (action === "publish" || action === "unpublish") {
    const { data: ed } = await supabase
      .from("certificate_editions")
      .select("*")
      .eq("id", edition_id)
      .single();
    if (action === "publish") {
      if (!ed?.template_confirmed)
        return NextResponse.json(
          { error: "Confirmez d'abord le modèle de certificat (aperçu)." },
          { status: 400 }
        );
      if (!ed?.template_bg_path || !ed?.template_settings)
        return NextResponse.json({ error: "Modèle incomplet." }, { status: 400 });
    }
    await supabase
      .from("certificate_editions")
      .update({
        published: action === "publish",
        updated_at: new Date().toISOString(),
      })
      .eq("id", edition_id);
    await writeAudit(supabase, gate.user?.email, action, "edition", edition_id);
    return NextResponse.json({ success: true });
  }

  if (action === "set_results_public") {
    await supabase
      .from("certificate_editions")
      .update({
        results_public: !!body.value,
        updated_at: new Date().toISOString(),
      })
      .eq("id", edition_id);
    return NextResponse.json({ success: true });
  }

  if (action === "preview_pdf") {
    const { data: ed } = await supabase
      .from("certificate_editions")
      .select("*")
      .eq("id", edition_id)
      .single();
    if (!ed?.template_bg_path || !ed?.template_settings)
      return NextResponse.json({ error: "Modèle incomplet" }, { status: 400 });

    const { data: bgFile, error: bgErr } = await supabase.storage
      .from("photos")
      .download(ed.template_bg_path);
    if (bgErr || !bgFile)
      return NextResponse.json({ error: "Fond introuvable" }, { status: 500 });
    const bgBytes = new Uint8Array(await bgFile.arrayBuffer());
    const mime = ed.template_bg_path.endsWith(".png") ? "image/png" : "image/jpeg";

    const fonts: { family: string; bytes: Uint8Array }[] = [];
    for (const f of ed.template_fonts || []) {
      const { data: ff } = await supabase.storage.from("photos").download(f.path);
      if (!ff)
        return NextResponse.json({ error: `Police manquante : ${f.family}` }, { status: 400 });
      fonts.push({ family: f.family, bytes: new Uint8Array(await ff.arrayBuffer()) });
    }

    const built = await buildCertificatePdf({
      background: bgBytes,
      backgroundMime: mime,
      settings: ed.template_settings,
      fonts,
      runner: { ...FICTIVE_RUNNER, edition: ed.code },
      offsets,
    });
    if (!built.ok || !built.pdf)
      return NextResponse.json({ error: built.error }, { status: 400 });

    return new NextResponse(Buffer.from(built.pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="apercu-certificat.pdf"',
      },
    });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}

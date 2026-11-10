import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdminSession } from "@/lib/supabase/require-admin";
import { parseResultsBuffer } from "@/lib/certificats/parse-results";
import { parseTmhPackage } from "@/lib/certificats/tmh-package";
import { buildCertificatePdf, FICTIVE_RUNNER } from "@/lib/certificats/pdf";
import {
  downloadCertBytes,
  loadTemplateFonts,
  mimeFromCertPath,
} from "@/lib/certificats/load-assets";
import { CERT_BUCKET } from "@/lib/certificats/storage";
import {
  parseOffsets,
  validateTemplateSettings,
  type FieldOffsets,
} from "@/lib/certificats/validate-settings";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function badUuid(id: unknown): boolean {
  return typeof id !== "string" || !UUID_RE.test(id);
}

function pdfResponse(bytes: Uint8Array, filename: string) {
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

async function uploadBytes(
  supabase: SupabaseClient,
  path: string,
  bytes: Uint8Array,
  contentType: string
) {
  const { error } = await supabase.storage.from(CERT_BUCKET).upload(path, bytes, {
    contentType,
    upsert: true,
  });
  return error;
}

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
 *         save_offsets | publish | unpublish | preview_pdf | reference_pdf
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
      if (!file || badUuid(editionId))
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
      if (!file || badUuid(editionId))
        return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
      const buf = await file.arrayBuffer();
      const parsed = await parseTmhPackage(buf);
      if (!parsed.ok) {
        return NextResponse.json(
          { error: parsed.errors.join(" "), errors: parsed.errors },
          { status: 400 }
        );
      }

      const base = `certificats/${editionId}`;
      const bgPath = `${base}/fond.${parsed.background!.mime === "image/png" ? "png" : "jpg"}`;
      const bgErr = await uploadBytes(
        supabase,
        bgPath,
        parsed.background!.bytes,
        parsed.background!.mime
      );
      if (bgErr) {
        return NextResponse.json(
          {
            error: `Stockage privé (${CERT_BUCKET}) : ${bgErr.message}. Exécutez la migration SQL du bucket privé.`,
          },
          { status: 500 }
        );
      }

      const fontMeta: { family: string; path: string; weight: string; file: string }[] = [];
      for (const f of parsed.fonts) {
        const safe = f.file.replace(/[^a-zA-Z0-9._ -]/g, "_");
        const fp = `${base}/fonts/${safe}`;
        const contentType = safe.toLowerCase().endsWith(".otf") ? "font/otf" : "font/ttf";
        const ferr = await uploadBytes(supabase, fp, f.bytes, contentType);
        if (ferr) {
          return NextResponse.json(
            { error: `Police non enregistrée (${f.family}) : ${ferr.message}` },
            { status: 500 }
          );
        }
        fontMeta.push({ family: f.family, path: fp, weight: f.weight, file: f.file });
      }

      let refPath: string | null = null;
      if (parsed.referencePdf) {
        refPath = `${base}/reference.pdf`;
        const rerr = await uploadBytes(
          supabase,
          refPath,
          parsed.referencePdf.bytes,
          "application/pdf"
        );
        if (rerr) {
          return NextResponse.json(
            { error: `PDF de référence non enregistré : ${rerr.message}` },
            { status: 500 }
          );
        }
      }

      const { error: upErr } = await supabase
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
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

      await writeAudit(supabase, gate.user?.email, "cert_template_package", "edition", editionId);
      return NextResponse.json({
        success: true,
        fonts: fontMeta.map((f) => `${f.family} (${f.weight})`),
        warnings: parsed.warnings,
        hasReference: !!refPath,
      });
    }

    if (action === "upload_template_image") {
      const file = form.get("file") as File | null;
      if (!file || badUuid(editionId))
        return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
      if (!/^image\/(jpeg|png)$/.test(file.type) && !/\.(png|jpe?g)$/i.test(file.name)) {
        return NextResponse.json({ error: "JPG ou PNG uniquement (pas de SVG)." }, { status: 400 });
      }
      if (file.size > 12 * 1024 * 1024)
        return NextResponse.json({ error: "Image trop grande (max 12 Mo)." }, { status: 400 });
      const isPng = file.type === "image/png" || /\.png$/i.test(file.name);
      const ext = isPng ? "png" : "jpg";
      const path = `certificats/${editionId}/fond.${ext}`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const uerr = await uploadBytes(
        supabase,
        path,
        bytes,
        isPng ? "image/png" : "image/jpeg"
      );
      if (uerr) {
        return NextResponse.json(
          { error: `Stockage privé (${CERT_BUCKET}) : ${uerr.message}` },
          { status: 500 }
        );
      }
      const { error: upErr } = await supabase
        .from("certificate_editions")
        .update({
          template_bg_path: path,
          template_confirmed: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editionId);
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
      return NextResponse.json({ success: true, path });
    }

    return NextResponse.json({ error: "Action multipart inconnue" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { action, edition_id, code, label } = body;

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

  if (badUuid(edition_id)) {
    return NextResponse.json({ error: "Édition invalide" }, { status: 400 });
  }

  if (action === "rollback") {
    const { data: ed } = await supabase
      .from("certificate_editions")
      .select("*")
      .eq("id", edition_id)
      .single();
    const snapshot = ed?.previous_snapshot as
      | { version?: number; rows?: Record<string, unknown>[] }
      | null
      | undefined;
    if (!snapshot?.rows) {
      return NextResponse.json({ error: "Aucune version précédente" }, { status: 400 });
    }
    await supabase.from("certificate_results").delete().eq("edition_id", edition_id);
    const rows = snapshot.rows.map((r) => {
      const rest = { ...r };
      delete rest.id;
      delete rest.created_at;
      return { ...rest, edition_id };
    });
    if (rows.length) await supabase.from("certificate_results").insert(rows);
    await supabase
      .from("certificate_editions")
      .update({
        results_version: snapshot.version || 0,
        previous_snapshot: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", edition_id);
    await writeAudit(supabase, gate.user?.email, "cert_rollback", "edition", edition_id);
    return NextResponse.json({ success: true });
  }

  if (action === "save_offsets") {
    const parsed = parseOffsets(body.offsets);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.errors.join(" ") }, { status: 400 });
    }
    const { error } = await supabase
      .from("certificate_editions")
      .update({
        template_offsets: parsed.offsets,
        template_confirmed: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", edition_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAudit(supabase, gate.user?.email, "cert_offsets", "edition", edition_id);
    return NextResponse.json({ success: true });
  }

  if (action === "confirm_template") {
    if (body.confirmed !== true) {
      return NextResponse.json(
        {
          error:
            "Confirmation explicite requise : comparez l'aperçu du site au PDF de référence TMH.",
        },
        { status: 400 }
      );
    }
    const parsedOffsets = parseOffsets(body.offsets ?? {});
    if (!parsedOffsets.ok) {
      return NextResponse.json({ error: parsedOffsets.errors.join(" ") }, { status: 400 });
    }
    const { data: ed } = await supabase
      .from("certificate_editions")
      .select("*")
      .eq("id", edition_id)
      .single();
    if (!ed?.template_bg_path || !ed.template_settings) {
      return NextResponse.json({ error: "Modèle incomplet." }, { status: 400 });
    }
    if (!ed.template_reference_pdf_path) {
      return NextResponse.json(
        { error: "PDF de référence TMH manquant. Réimportez le paquet ZIP." },
        { status: 400 }
      );
    }
    const settingsOk = validateTemplateSettings(ed.template_settings);
    if (!settingsOk.ok) {
      return NextResponse.json({ error: settingsOk.errors.join(" ") }, { status: 400 });
    }
    const built = await renderEditionPdf(supabase, ed, parsedOffsets.offsets);
    if (!built.ok) return NextResponse.json({ error: built.error }, { status: 400 });

    const { error } = await supabase
      .from("certificate_editions")
      .update({
        template_offsets: parsedOffsets.offsets,
        template_confirmed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", edition_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAudit(supabase, gate.user?.email, "cert_confirm_template", "edition", edition_id);
    return NextResponse.json({ success: true });
  }

  if (action === "publish" || action === "unpublish") {
    const { data: ed } = await supabase
      .from("certificate_editions")
      .select("*")
      .eq("id", edition_id)
      .single();
    if (action === "publish") {
      if (!ed?.template_confirmed) {
        return NextResponse.json(
          { error: "Confirmez d'abord le modèle après comparaison avec le PDF TMH." },
          { status: 400 }
        );
      }
      if (!ed?.template_bg_path || !ed?.template_settings || !ed?.template_reference_pdf_path) {
        return NextResponse.json({ error: "Modèle incomplet." }, { status: 400 });
      }
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
    return NextResponse.json(
      {
        error:
          "La liste publique des coureurs est désactivée. Chaque finisher obtient son certificat avec l'édition, le dossard et le nom.",
      },
      { status: 400 }
    );
  }

  if (action === "reference_pdf") {
    const { data: ed } = await supabase
      .from("certificate_editions")
      .select("template_reference_pdf_path")
      .eq("id", edition_id)
      .single();
    if (!ed?.template_reference_pdf_path) {
      return NextResponse.json({ error: "PDF de référence TMH absent." }, { status: 404 });
    }
    const bytes = await downloadCertBytes(supabase, ed.template_reference_pdf_path);
    if (!bytes) {
      return NextResponse.json(
        { error: "PDF de référence introuvable dans le stockage privé." },
        { status: 404 }
      );
    }
    return pdfResponse(bytes, "reference-tmh.pdf");
  }

  if (action === "preview_pdf") {
    const parsedOffsets = parseOffsets(body.offsets ?? null);
    if (!parsedOffsets.ok) {
      return NextResponse.json({ error: parsedOffsets.errors.join(" ") }, { status: 400 });
    }
    const { data: ed } = await supabase
      .from("certificate_editions")
      .select("*")
      .eq("id", edition_id)
      .single();
    if (!ed) return NextResponse.json({ error: "Édition introuvable" }, { status: 404 });
    const useOffsets =
      body.offsets == null
        ? parseOffsets(ed.template_offsets ?? {})
        : parsedOffsets;
    if (!useOffsets.ok) {
      return NextResponse.json({ error: useOffsets.errors.join(" ") }, { status: 400 });
    }
    const built = await renderEditionPdf(supabase, ed, useOffsets.offsets);
    if (!built.ok || !built.pdf) {
      return NextResponse.json({ error: built.error || "Aperçu impossible" }, { status: 400 });
    }
    return pdfResponse(built.pdf, "apercu-certificat.pdf");
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}

async function renderEditionPdf(
  supabase: SupabaseClient,
  ed: {
    code?: string;
    template_bg_path?: string | null;
    template_settings?: unknown;
    template_fonts?: unknown;
  },
  offsets: FieldOffsets
) {
  if (!ed.template_bg_path || !ed.template_settings) {
    return { ok: false as const, error: "Modèle incomplet" };
  }
  const mime = mimeFromCertPath(ed.template_bg_path);
  if (!mime) return { ok: false as const, error: "Fond PNG ou JPG uniquement." };
  const bgBytes = await downloadCertBytes(supabase, ed.template_bg_path);
  if (!bgBytes) {
    return {
      ok: false as const,
      error: "Fond introuvable dans le stockage privé. Réimportez le paquet TMH.",
    };
  }
  const loaded = await loadTemplateFonts(supabase, ed.template_fonts);
  if (!loaded.ok) return { ok: false as const, error: loaded.error };
  return buildCertificatePdf({
    background: bgBytes,
    backgroundMime: mime,
    settings: ed.template_settings,
    fonts: loaded.fonts,
    runner: { ...FICTIVE_RUNNER, edition: ed.code || FICTIVE_RUNNER.edition },
    offsets,
  });
}

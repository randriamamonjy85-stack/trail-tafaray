import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/supabase/require-admin";
import {
  ALLOWED_SPONSOR_IMAGE_TYPES,
  MAX_SPONSOR_IMAGE_BYTES,
  isAllowedSponsorImageType,
} from "@/lib/sponsors/logic";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requireAdminSession();
  if (gate.response) return gate.response;
  const { data, error } = await gate.admin!
    .from("sponsors")
    .select("*")
    .order("ordre", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sponsors: data || [] });
}

export async function POST(request: Request) {
  const gate = await requireAdminSession();
  if (gate.response) return gate.response;
  const supabase = gate.admin!;
  const ctype = request.headers.get("content-type") || "";

  if (ctype.includes("multipart/form-data")) {
    const form = await request.formData();
    const action = String(form.get("action") || "create");
    const file = form.get("file") as File | null;

    if (action === "upload_image") {
      if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
      if (!isAllowedSponsorImageType(file.type)) {
        return NextResponse.json(
          { error: "Formats acceptés : PNG, JPG, WebP (pas de SVG)." },
          { status: 400 }
        );
      }
      if (file.size > MAX_SPONSOR_IMAGE_BYTES) {
        return NextResponse.json({ error: "Image trop grande (max 2 Mo)." }, { status: 400 });
      }
      const ext =
        file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `sponsors/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { error } = await supabase.storage.from("sponsors").upload(path, bytes, {
        contentType: file.type,
        upsert: false,
      });
      if (error) {
        return NextResponse.json(
          {
            error:
              error.message +
              " — Créez le bucket public « sponsors » dans Supabase Storage si besoin.",
          },
          { status: 500 }
        );
      }
      const { data: pub } = supabase.storage.from("sponsors").getPublicUrl(path);
      return NextResponse.json({ url: pub.publicUrl, path });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }

  const body = await request.json();
  const action = body.action as string;

  if (action === "create") {
    const nom = String(body.nom || "").trim().slice(0, 120);
    if (!nom) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    const row = {
      nom,
      image_url: String(body.image_url || "").slice(0, 500),
      site_url: body.site_url ? String(body.site_url).slice(0, 500) : null,
      date_debut: body.date_debut || null,
      date_fin: body.date_fin || null,
      actif: body.actif !== false,
      ordre: Number(body.ordre) || 0,
      afficher_popup: !!body.afficher_popup,
      afficher_bande: body.afficher_bande !== false,
    };
    const { data, error } = await supabase.from("sponsors").insert(row).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAudit(supabase, gate.user?.email, "sponsor_create", "sponsor", data.id);
    return NextResponse.json({ sponsor: data });
  }

  if (action === "update") {
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const k of [
      "nom",
      "image_url",
      "site_url",
      "date_debut",
      "date_fin",
      "actif",
      "ordre",
      "afficher_popup",
      "afficher_bande",
    ]) {
      if (body[k] !== undefined) patch[k] = body[k];
    }
    if (typeof patch.nom === "string") patch.nom = patch.nom.trim().slice(0, 120);
    const { error } = await supabase.from("sponsors").update(patch).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAudit(supabase, gate.user?.email, "sponsor_update", "sponsor", id);
    return NextResponse.json({ success: true });
  }

  if (action === "delete") {
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const { error } = await supabase.from("sponsors").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAudit(supabase, gate.user?.email, "sponsor_delete", "sponsor", id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}

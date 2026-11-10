import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/supabase/require-admin";

/** Public : courses actives seulement */
export async function GET(request: Request) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "1";

  if (all) {
    const gate = await requireAdminSession();
    if (gate.response) return gate.response;
    const { data, error } = await gate.admin!.from("courses").select("*").order("ordre");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  }

  const { data, error } = await supabase
    .from("courses")
    .select("id,nom,slug,distance,denivele,type_epreuve,tarif,image_url,ordre,active")
    .eq("active", true)
    .order("ordre");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const gate = await requireAdminSession();
  if (gate.response) return gate.response;
  const body = await request.json();
  const { error } = await gate.admin!.from("courses").insert(body);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const gate = await requireAdminSession();
  if (gate.response) return gate.response;
  const body = await request.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const { error } = await gate.admin!.from("courses").update(rest).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/supabase/require-admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
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

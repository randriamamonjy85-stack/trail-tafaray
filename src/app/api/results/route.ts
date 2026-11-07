import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/supabase/require-admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("resultats")
    .select("*")
    .order("position", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const gate = await requireAdminSession();
  if (gate.response) return gate.response;

  try {
    const results = await request.json();
    const supabase = gate.admin!;
    await supabase.from("resultats").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (Array.isArray(results) && results.length > 0) {
      const { error } = await supabase.from("resultats").insert(results);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

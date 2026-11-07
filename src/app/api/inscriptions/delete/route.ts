import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/supabase/require-admin";
import { writeAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const gate = await requireAdminSession();
  if (gate.response) return gate.response;

  const body = await request.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  const { data: row } = await gate.admin!
    .from("inscriptions")
    .select("reference, prenom, nom")
    .eq("id", id)
    .maybeSingle();

  const { error } = await gate.admin!.from("inscriptions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAudit(
    gate.admin!,
    gate.user?.email,
    "supprimer",
    "inscription",
    row ? `${row.reference} ${row.prenom} ${row.nom}` : String(id)
  );

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/supabase/require-admin";

export async function POST(request: Request) {
  const gate = await requireAdminSession();
  if (gate.response) return gate.response;

  const body = await request.json();
  const { id, action } = body;

  if (!id || !["valider", "refuser"].includes(action)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const statut = action === "valider" ? "Validé" : "Refusé";
  const { error } = await gate.admin!
    .from("inscriptions")
    .update({ statut })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

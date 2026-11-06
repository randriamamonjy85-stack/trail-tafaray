import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json();
  const { id, action } = body; // action: "valider" | "refuser"

  if (!id || !["valider", "refuser"].includes(action)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const statut = action === "valider" ? "Validé" : "Refusé";
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("inscriptions")
    .update({ statut })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

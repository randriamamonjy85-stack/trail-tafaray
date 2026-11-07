import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/** Vérifie qu'une session utilisateur authentifiée existe. */
export async function requireAdminSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { user: null, response: NextResponse.json({ error: "Non autorisé" }, { status: 401 }) };
  }
  return { user: data.user, response: null as NextResponse | null, admin: createAdminClient() };
}

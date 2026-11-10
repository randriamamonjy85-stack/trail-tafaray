import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * E-mails administrateurs autorisés.
 * Variable Vercel : ADMIN_EMAILS=trailtafaray@gmail.com,autre@exemple.com
 * Si vide : tout utilisateur connecté (comportement ancien — à éviter en prod).
 */
function allowedAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdminSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Non autorisé" }, { status: 401 }),
    };
  }

  const email = (data.user.email || "").toLowerCase();
  const allow = allowedAdminEmails();
  if (allow.length > 0 && !allow.includes(email)) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Compte non administrateur" },
        { status: 403 }
      ),
    };
  }

  return {
    user: data.user,
    response: null as NextResponse | null,
    admin: createAdminClient(),
  };
}

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAllowedAdminEmail } from "@/lib/admin-allowlist";
import { NextResponse } from "next/server";

/**
 * E-mails administrateurs autorisés.
 * Variable Vercel : ADMIN_EMAILS=adresse@exemple.com,autre@exemple.com
 * Si la liste est vide, personne n'est administrateur.
 */
function adminAllowlistRaw(): string {
  return process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";
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

  const email = data.user.email || "";
  if (!isAllowedAdminEmail(email, adminAllowlistRaw())) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Accès administrateur refusé" },
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

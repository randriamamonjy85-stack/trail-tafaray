import type { SupabaseClient } from "@supabase/supabase-js";

export async function writeAudit(
  admin: SupabaseClient,
  userEmail: string | undefined,
  action: string,
  objet?: string,
  detail?: string
) {
  try {
    await admin.from("admin_audit_log").insert({
      user_email: userEmail || null,
      action,
      objet: objet || null,
      detail: detail || null,
    });
  } catch {
    /* ne pas bloquer l'action métier */
  }
}

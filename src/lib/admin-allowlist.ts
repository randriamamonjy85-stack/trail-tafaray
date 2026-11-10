/** Liste fermée des administrateurs (ADMIN_EMAILS ou ADMIN_EMAIL). */
export function parseAdminEmails(raw: string | undefined | null): string[] {
  return String(raw || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Liste vide = personne n'est administrateur.
 * Un compte connecté n'est pas admin par défaut.
 */
export function isAllowedAdminEmail(
  email: string,
  raw: string | undefined | null
): boolean {
  const allow = parseAdminEmails(raw);
  if (allow.length === 0) return false;
  return allow.includes(email.trim().toLowerCase());
}

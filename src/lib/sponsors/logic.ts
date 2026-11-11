/** Logique pure sponsors (dates, rotation, pages exclues) — testable sans UI. */

export type SponsorRecord = {
  id: string;
  nom: string;
  image_url: string;
  site_url?: string | null;
  date_debut?: string | null;
  date_fin?: string | null;
  actif: boolean;
  ordre: number;
  afficher_popup?: boolean;
  afficher_bande?: boolean;
  vues?: number;
  clics?: number;
};

/** Pages où le pop-up et la bande ne doivent pas apparaître. */
export const SPONSOR_EXCLUDED_PATHS = [
  "/inscription",
  "/admin",
  "/certificat",
] as const;

export function isSponsorExcludedPath(pathname: string): boolean {
  const p = (pathname || "/").split("?")[0].replace(/\/$/, "") || "/";
  if (p === "/admin" || p.startsWith("/admin/")) return true;
  if (p === "/inscription" || p.startsWith("/inscription/")) return true;
  if (p === "/certificat" || p.startsWith("/certificat/")) return true;
  // pas de page paiement dédiée ; si ajoutée plus tard, l'exclure ici
  if (p.startsWith("/api/")) return true;
  return false;
}

function parseDateOnly(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = String(s).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
}

/** Actif selon flag + fenêtre de dates (inclusives), jour UTC. */
export function isSponsorActiveOn(
  s: Pick<SponsorRecord, "actif" | "date_debut" | "date_fin">,
  now: Date = new Date()
): boolean {
  if (!s.actif) return false;
  const day = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const debut = parseDateOnly(s.date_debut);
  const fin = parseDateOnly(s.date_fin);
  if (debut && day < debut.getTime()) return false;
  if (fin && day > fin.getTime()) return false;
  return true;
}

export function filterActiveSponsors(
  list: SponsorRecord[],
  now: Date = new Date()
): SponsorRecord[] {
  return list
    .filter((s) => isSponsorActiveOn(s, now))
    .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
}

export function sponsorsForPopup(list: SponsorRecord[], now?: Date): SponsorRecord[] {
  return filterActiveSponsors(list, now).filter((s) => s.afficher_popup);
}

export function sponsorsForBand(list: SponsorRecord[], now?: Date): SponsorRecord[] {
  return filterActiveSponsors(list, now).filter((s) => s.afficher_bande);
}

/**
 * Rotation : un seul sponsor par visite.
 * index stocké côté client (sessionStorage) ; on avance à chaque nouvelle visite.
 */
export function pickRotatedSponsor(
  candidates: SponsorRecord[],
  rotationIndex: number
): SponsorRecord | null {
  if (!candidates.length) return null;
  const i = ((rotationIndex % candidates.length) + candidates.length) % candidates.length;
  return candidates[i];
}

export const MAX_SPONSOR_IMAGE_BYTES = 2 * 1024 * 1024; // 2 Mo
export const ALLOWED_SPONSOR_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function isAllowedSponsorImageType(mime: string): boolean {
  return (ALLOWED_SPONSOR_IMAGE_TYPES as readonly string[]).includes(mime);
}

/** Longueur max stockée pour site_url (l’API refuse au-delà, sans couper). */
export const SPONSOR_SITE_URL_MAX_LENGTH = 500;

export const INVALID_SPONSOR_SITE_URL_MESSAGE =
  "Le lien du site doit être une URL http:// ou https:// valide.";

/**
 * URL http(s) explicite. Vide n'est pas traité ici.
 * Refuse javascript:, data:, les schémas sans //, et les caractères
 * que le parseur URL réécrit (contrôles, espaces, guillemets, antislash).
 */
function parsedSponsorHttpUrl(value: string): URL | null {
  if (!value || value.length > 2048) return null;
  if (!/^https?:\/\//i.test(value)) return null;
  if (/[\u0000-\u001F\u007F]/.test(value) || /\s/u.test(value)) return null;
  if (/["'<>\\]/.test(value)) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!url.hostname) return null;
  if (!/^https?:\/\//i.test(url.href)) return null;
  return url;
}

/**
 * Valeur admin : null / absent / chaîne vide = pas de lien.
 * Sinon uniquement une URL http:// ou https:// (max 500 caractères).
 */
export function normalizeSponsorSiteUrl(
  value: unknown
): { ok: true; url: string | null } | { ok: false; error: string } {
  if (value == null) return { ok: true, url: null };
  if (typeof value !== "string") {
    return { ok: false, error: INVALID_SPONSOR_SITE_URL_MESSAGE };
  }
  const trimmed = value.trim();
  if (trimmed === "") return { ok: true, url: null };
  if (trimmed.length > SPONSOR_SITE_URL_MAX_LENGTH || parsedSponsorHttpUrl(trimmed) === null) {
    return { ok: false, error: INVALID_SPONSOR_SITE_URL_MESSAGE };
  }
  return { ok: true, url: trimmed };
}

/**
 * Href à rendre dans le pop-up / la bande.
 * null si vide ou si le lien n'est pas http(s) (ex. javascript:).
 * Renvoie l'URL normalisée par le parseur, jamais la chaîne brute.
 */
export function sponsorSiteHref(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const url = parsedSponsorHttpUrl(trimmed);
  return url ? url.href : null;
}

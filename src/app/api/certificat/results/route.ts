import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp, enforceLimits } from "@/lib/rate-limit-shared";

export const runtime = "nodejs";

/**
 * Ne liste jamais les coureurs.
 * Le certificat se récupère un par un via /api/certificat/lookup.
 */
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const ok = await enforceLimits(supabase, [
      {
        prefix: "cert-results-ip-min",
        raw: clientIp(request),
        limit: 10,
        windowMs: 60_000,
      },
    ]);
    if (!ok) {
      return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });
    }
  } catch {
    /* pas de liste, même si le compteur est indisponible */
  }
  return NextResponse.json(
    { error: "La liste publique des coureurs n'est pas disponible." },
    { status: 404 }
  );
}

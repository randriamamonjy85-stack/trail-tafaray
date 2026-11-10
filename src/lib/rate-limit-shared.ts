import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { rateLimit } from "./rate-limit";

/**
 * Compteur partagé entre les instances Vercel (table Supabase, service_role).
 * Si la migration n'est pas encore appliquée, repli sur la mémoire de l'instance.
 * La clé stockée est un hash : pas d'adresse IP en clair.
 */
export function hashBucket(prefix: string, raw: string): string {
  const digest = createHash("sha256")
    .update(`trail-tafaray|${prefix}|${raw}`)
    .digest("hex")
    .slice(0, 40);
  return `${prefix}:${digest}`;
}

type RpcRow = { allowed?: boolean; remaining?: number };

function readRow(data: unknown): RpcRow | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;
  const allowed = (row as RpcRow).allowed;
  if (typeof allowed !== "boolean") return null;
  return row as RpcRow;
}

export async function consumeRateLimit(
  supabase: SupabaseClient | null,
  bucket: string,
  limit: number,
  windowMs: number
): Promise<{ ok: boolean; remaining: number; backend: "supabase" | "memory" }> {
  const windowSeconds = Math.max(1, Math.round(windowMs / 1000));
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("consume_public_rate_limit", {
        p_bucket: bucket.slice(0, 200),
        p_window_seconds: windowSeconds,
        p_limit: limit,
      });
      if (!error) {
        const row = readRow(data);
        if (row && typeof row.allowed === "boolean") {
          return {
            ok: row.allowed,
            remaining: Number(row.remaining ?? 0),
            backend: "supabase",
          };
        }
      }
    } catch {
      /* migration absente ou réseau : repli mémoire */
    }
  }
  const mem = rateLimit(bucket, limit, windowMs);
  return { ok: mem.ok, remaining: mem.remaining, backend: "memory" };
}

export async function enforceLimits(
  supabase: SupabaseClient | null,
  checks: { prefix: string; raw: string; limit: number; windowMs: number }[]
): Promise<boolean> {
  for (const c of checks) {
    const r = await consumeRateLimit(
      supabase,
      hashBucket(c.prefix, c.raw),
      c.limit,
      c.windowMs
    );
    if (!r.ok) return false;
  }
  return true;
}

export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first.slice(0, 80);
  }
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 80);
  return "unknown";
}

import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { consumeRateLimit, hashBucket } from "../rate-limit-shared";

function fakeClient(result: { data: unknown; error: { message: string } | null }): SupabaseClient {
  return {
    rpc: async () => result,
  } as unknown as SupabaseClient;
}

describe("consumeRateLimit", () => {
  it("utilise la réponse Supabase quand la fonction existe", async () => {
    const denied = await consumeRateLimit(
      fakeClient({ data: { allowed: false, remaining: 0 }, error: null }),
      "cert-test:abc",
      8,
      60_000
    );
    expect(denied.ok).toBe(false);
    expect(denied.backend).toBe("supabase");

    const allowed = await consumeRateLimit(
      fakeClient({ data: [{ allowed: true, remaining: 3 }], error: null }),
      "cert-test:abc",
      8,
      60_000
    );
    expect(allowed.ok).toBe(true);
    expect(allowed.remaining).toBe(3);
  });

  it("replie sur la mémoire si la migration n'est pas appliquée", async () => {
    const key = hashBucket("cert-test-mem", `k-${Date.now()}-${Math.random()}`);
    const client = fakeClient({ data: null, error: { message: "function not found" } });
    const first = await consumeRateLimit(client, key, 1, 60_000);
    const second = await consumeRateLimit(client, key, 1, 60_000);
    expect(first.ok).toBe(true);
    expect(first.backend).toBe("memory");
    expect(second.ok).toBe(false);
  });
});

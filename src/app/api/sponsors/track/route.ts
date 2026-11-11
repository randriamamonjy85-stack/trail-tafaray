import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rl = rateLimit(`sponsor-track:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: { id?: string; kind?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const id = String(body.id || "");
  const kind = String(body.kind || "");
  if (!id || (kind !== "view" && kind !== "click")) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("increment_sponsor_stat", {
      p_id: id,
      p_kind: kind,
    });
    if (error) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

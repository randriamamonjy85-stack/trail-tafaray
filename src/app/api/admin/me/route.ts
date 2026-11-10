import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/supabase/require-admin";

/** 200 seulement si l'e-mail est dans ADMIN_EMAILS / ADMIN_EMAIL. */
export async function GET() {
  const gate = await requireAdminSession();
  if (gate.response) return gate.response;
  return NextResponse.json({ ok: true });
}

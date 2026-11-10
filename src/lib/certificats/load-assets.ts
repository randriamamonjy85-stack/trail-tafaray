import type { SupabaseClient } from "@supabase/supabase-js";
import type { FontBytes } from "./pdf";
import { CERT_BUCKET } from "./storage";
import type { FontWeight } from "./validate-settings";

export async function downloadCertBytes(
  supabase: SupabaseClient,
  path: string
): Promise<Uint8Array | null> {
  const { data, error } = await supabase.storage.from(CERT_BUCKET).download(path);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

export function mimeFromCertPath(path: string): "image/png" | "image/jpeg" | null {
  const p = path.toLowerCase();
  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
  return null;
}

type StoredFont = { family?: string; path?: string; weight?: string };

export async function loadTemplateFonts(
  supabase: SupabaseClient,
  templateFonts: unknown
): Promise<{ ok: true; fonts: FontBytes[] } | { ok: false; error: string }> {
  if (!Array.isArray(templateFonts) || templateFonts.length === 0) {
    return { ok: false, error: "Aucune police enregistrée pour ce modèle." };
  }
  const fonts: FontBytes[] = [];
  for (const raw of templateFonts as StoredFont[]) {
    const family = String(raw?.family || "");
    const path = String(raw?.path || "");
    if (!family || !path.startsWith("certificats/") || path.includes("..")) {
      return { ok: false, error: "Chemin de police invalide." };
    }
    const bytes = await downloadCertBytes(supabase, path);
    if (!bytes) {
      return {
        ok: false,
        error: `Police introuvable dans le stockage privé : ${family}. Réimportez le paquet TMH.`,
      };
    }
    const weight: FontWeight = raw.weight === "bold" ? "bold" : "normal";
    fonts.push({ family, weight, bytes });
  }
  return { ok: true, fonts };
}

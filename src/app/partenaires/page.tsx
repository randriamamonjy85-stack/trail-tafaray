import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import PartnersShowcase from "@/components/PartnersShowcase";

export const dynamic = "force-dynamic";

export default async function PartenairesPage() {
  const settings = await getSettings();
  if (!settings.partenaires_visibles) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-[#1F2C3F] mb-4">Partenaires</h1>
        <p className="text-stone-600">Cette section n&apos;est pas disponible pour le moment.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: partenaires } = await supabase
    .from("partenaires")
    .select("*")
    .eq("visible", true)
    .order("ordre");

  const list = partenaires || [];
  const email = (settings as any).email_partenariat || "trailtafaray@gmail.com";
  const cta =
    (settings as any).texte_partenaires_cta ||
    "Soutenez Trail Tafaray et associez votre image à un événement sportif engagé au cœur d’Anjeva.";
  const mailto = `mailto:${email}?subject=${encodeURIComponent("Demande de partenariat – Association Trail Tafaray")}`;

  return (
    <div className="bg-[#F7F4EF] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-16">
          <p className="text-[#A1532D] text-xs tracking-[0.2em] uppercase font-semibold mb-3">
            Ils nous soutiennent
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-[#1F2C3F] mb-4">
            Nos partenaires
          </h1>
          <p className="text-stone-600 max-w-xl mx-auto text-sm sm:text-base">
            Merci aux organisations qui rendent le Trail Tafaray possible, du départ jusqu&apos;à la
            ligne d&apos;arrivée.
          </p>
        </div>

        {list.length === 0 ? (
          <p className="text-center text-stone-500">Les partenaires seront annoncés prochainement.</p>
        ) : (
          <PartnersShowcase partenaires={list} variant="page" />
        )}

        <div className="mt-20 text-center">
          <h2 className="text-xl font-bold text-[#1F2C3F] mb-3">
            Devenez partenaire de Trail Tafaray
          </h2>
          <p className="text-stone-600 text-sm max-w-lg mx-auto mb-6">{cta}</p>
          <a
            href={mailto}
            className="inline-block bg-[#1F2C3F] text-white px-8 py-3 rounded-full font-semibold text-sm hover:bg-[#2a3d55] transition"
          >
            Devenir partenaire
          </a>
        </div>
      </div>
    </div>
  );
}

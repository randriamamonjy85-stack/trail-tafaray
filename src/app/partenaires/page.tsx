import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import PartnersShowcase from "@/components/PartnersShowcase";

export const dynamic = "force-dynamic";

export default async function PartenairesPage() {
  const settings = await getSettings();
  if (!settings.partenaires_visibles) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-semibold text-[#0f1b2d] mb-4 font-[family-name:var(--font-display)]">Partenaires</h1>
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
    "Soutenez Trail Tafaray et associez votre image à un événement sportif engagé au cœur d'Anjeva.";
  const mailto = `mailto:${email}?subject=${encodeURIComponent("Demande de partenariat – Association Trail Tafaray")}`;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <section className="relative bg-[#0f1b2d] text-white py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(900px_400px_at_20%_0%,rgba(183,121,61,0.28),transparent_60%),radial-gradient(700px_350px_at_90%_100%,rgba(217,164,65,0.18),transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d9a441]/50 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[#f0c96b] text-xs tracking-[0.22em] uppercase font-semibold mb-4">Ils nous soutiennent</p>
          <h1 className="text-4xl sm:text-6xl font-semibold mb-5 tracking-tight font-[family-name:var(--font-display)]">
            Nos partenaires
          </h1>
          <p className="text-stone-300 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Merci aux organisations qui rendent le Trail Tafaray possible, du départ jusqu&apos;à la ligne d&apos;arrivée.
          </p>
        </div>
      </section>

      <section className="relative py-16 sm:py-24 bg-gradient-to-b from-[#f8f7f4] via-[#fffaf3] to-[#f3ede3]">
        <div className="absolute inset-0 bg-[radial-gradient(600px_240px_at_10%_20%,rgba(183,121,61,0.08),transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {list.length === 0 ? (
            <div className="premium-card rounded-3xl p-12 text-center">
              <p className="text-stone-600 text-lg">Les partenaires seront annoncés prochainement.</p>
            </div>
          ) : (
            <PartnersShowcase partenaires={list} variant="page" />
          )}
        </div>
      </section>

      <section className="relative py-16 sm:py-20 bg-[#0f1b2d] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(600px_260px_at_50%_0%,rgba(217,164,65,0.22),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <p className="text-[#f0c96b] text-xs tracking-[0.22em] uppercase font-semibold mb-3">Collaboration</p>
          <h2 className="text-3xl sm:text-4xl font-semibold mb-4 font-[family-name:var(--font-display)]">
            Devenez partenaire de Trail Tafaray
          </h2>
          <p className="text-stone-300 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">{cta}</p>
          <a
            href={mailto}
            className="inline-flex bg-gradient-to-r from-[#b7793d] to-[#d9a441] text-[#0f1b2d] px-9 py-3.5 rounded-full font-semibold hover:brightness-110 transition shadow-xl shadow-black/25"
          >
            Devenir partenaire
          </a>
        </div>
      </section>
    </div>
  );
}

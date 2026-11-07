import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  sponsor_officiel: "Sponsor officiel",
  sponsor_principal: "Sponsor principal",
  partenaire_officiel: "Partenaire officiel",
  institutionnel: "Partenaire institutionnel",
  technique: "Partenaire technique",
  media: "Partenaire média",
  logistique: "Partenaire logistique",
  autre: "Autre partenaire",
  officiel: "Partenaire officiel",
};

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

  const email = (settings as any).email_partenariat || "trailtafaray@gmail.com";
  const cta =
    (settings as any).texte_partenaires_cta ||
    "Soutenez Trail Tafaray et associez votre image à un événement sportif engagé au cœur d’Anjeva.";
  const mailto = `mailto:${email}?subject=${encodeURIComponent("Demande de partenariat – Association Trail Tafaray")}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-[#1F2C3F] mb-4">Partenaires</h1>
      <p className="text-stone-600 mb-12 max-w-2xl">
        Merci à tous ceux qui soutiennent Trail Tafaray.
      </p>

      {!partenaires || partenaires.length === 0 ? (
        <p className="text-stone-500 mb-12">Les partenaires seront annoncés prochainement.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {partenaires.map((p: any) => {
            const inner = (
              <>
                {p.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logo_url} alt={p.nom} className="h-20 object-contain mb-4" />
                )}
                <h2 className="text-lg font-bold text-[#1F2C3F]">{p.nom}</h2>
                {p.type && (
                  <span className="text-xs text-[#A1532D] uppercase tracking-wide mt-1">
                    {TYPE_LABELS[p.type] || p.type}
                  </span>
                )}
                {p.description && (
                  <p className="text-sm text-stone-600 mt-3">{p.description}</p>
                )}
              </>
            );
            return p.site_url ? (
              <a
                key={p.id}
                href={p.site_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col items-center text-center hover:shadow-md transition"
              >
                {inner}
              </a>
            ) : (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col items-center text-center"
              >
                {inner}
              </div>
            );
          })}
        </div>
      )}

      {/* CTA Devenir partenaire */}
      <section className="bg-[#1F2C3F] text-white rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Devenez partenaire de Trail Tafaray
        </h2>
        <p className="text-stone-300 max-w-2xl mx-auto mb-8">{cta}</p>
        <a
          href={mailto}
          className="inline-block bg-[#A1532D] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#8a4526]"
        >
          Devenir partenaire
        </a>
      </section>
    </div>
  );
}

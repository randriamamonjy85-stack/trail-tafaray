import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-[#1F2C3F] mb-4">Partenaires</h1>
      <p className="text-stone-600 mb-12 max-w-2xl">
        Merci à tous ceux qui soutiennent Trail Tafaray.
      </p>

      {!partenaires || partenaires.length === 0 ? (
        <p className="text-stone-500">Les partenaires seront annoncés prochainement.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {partenaires.map((p: any) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col items-center text-center"
            >
              {p.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.logo_url} alt={p.nom} className="h-20 object-contain mb-4" />
              )}
              <h2 className="text-lg font-bold text-[#1F2C3F]">{p.nom}</h2>
              {p.type && (
                <span className="text-xs text-[#A1532D] uppercase tracking-wide mt-1">{p.type}</span>
              )}
              {p.description && (
                <p className="text-sm text-stone-600 mt-3">{p.description}</p>
              )}
              {p.site_url && (
                <a
                  href={p.site_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#1F2C3F] mt-3 hover:underline"
                >
                  Visiter le site →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

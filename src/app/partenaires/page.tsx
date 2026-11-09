import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const HIERARCHY: { key: string; title: string; subtitle: string }[] = [
  {
    key: "sponsor_officiel",
    title: "Sponsors officiels",
    subtitle: "Partenaires majeurs de Trail Tafaray",
  },
  {
    key: "sponsor_principal",
    title: "Sponsors principaux",
    subtitle: "Soutien stratégique de l'événement",
  },
  {
    key: "partenaire_officiel",
    title: "Partenaires officiels",
    subtitle: "Engagés à nos côtés",
  },
  {
    key: "officiel",
    title: "Partenaires officiels",
    subtitle: "Engagés à nos côtés",
  },
  {
    key: "institutionnel",
    title: "Partenaires institutionnels",
    subtitle: "Institutions et collectivités",
  },
  {
    key: "technique",
    title: "Partenaires techniques",
    subtitle: "Expertise et moyens techniques",
  },
  {
    key: "logistique",
    title: "Partenaires logistiques",
    subtitle: "Organisation et logistique",
  },
  {
    key: "media",
    title: "Partenaires médias",
    subtitle: "Diffusion et communication",
  },
  {
    key: "autre",
    title: "Autres partenaires",
    subtitle: "Avec tous nos remerciements",
  },
];

function PartnerCard({ p, size }: { p: any; size: "xl" | "lg" | "md" }) {
  const h = size === "xl" ? "h-36" : size === "lg" ? "h-28" : "h-20";
  const pad = size === "xl" ? "p-10" : size === "lg" ? "p-8" : "p-6";
  const inner = (
    <>
      {p.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.logo_url}
          alt={p.nom}
          className={`${h} w-auto max-w-full object-contain mx-auto`}
        />
      ) : (
        <div className={`${h} flex items-center justify-center`}>
          <span className="text-lg font-semibold text-[#1F2C3F] text-center">{p.nom}</span>
        </div>
      )}
      <h3 className="mt-4 text-center font-semibold text-[#1F2C3F]">{p.nom}</h3>
      {p.description && (
        <p className="mt-2 text-sm text-stone-600 text-center max-w-md mx-auto leading-relaxed">
          {p.description}
        </p>
      )}
      {p.site_url && (
        <p className="mt-3 text-xs text-[#A1532D] text-center font-medium">
          Visiter le site →
        </p>
      )}
    </>
  );

  const cls = `bg-white rounded-3xl border border-stone-200/80 shadow-sm hover:shadow-lg transition-shadow ${pad} flex flex-col items-center`;

  return p.site_url ? (
    <a href={p.site_url} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

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
  const used = new Set<string>();
  const groups = HIERARCHY.map((g) => {
    const items = list.filter((p: any) => p.type === g.key);
    items.forEach((p: any) => used.add(p.id));
    return { ...g, items };
  }).filter((g) => g.items.length > 0);

  // Non classés
  const rest = list.filter((p: any) => !used.has(p.id));
  if (rest.length) {
    groups.push({
      key: "_other",
      title: "Nos partenaires",
      subtitle: "Avec tous nos remerciements",
      items: rest,
    });
  }

  const email = (settings as any).email_partenariat || "trailtafaray@gmail.com";
  const cta =
    (settings as any).texte_partenaires_cta ||
    "Soutenez Trail Tafaray et associez votre image à un événement sportif engagé au cœur d’Anjeva.";
  const mailto = `mailto:${email}?subject=${encodeURIComponent("Demande de partenariat – Association Trail Tafaray")}`;

  return (
    <div className="bg-stone-50 min-h-screen">
      <div className="bg-[#1F2C3F] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#A1532D] text-sm tracking-widest uppercase mb-3 font-medium">
            Merci à eux
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Nos partenaires</h1>
          <p className="text-stone-300 max-w-2xl mx-auto">
            Institutions, entreprises et acteurs engagés qui rendent Trail Tafaray possible.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {groups.length === 0 && (
          <p className="text-center text-stone-500">Les partenaires seront annoncés prochainement.</p>
        )}

        {groups.map((g, idx) => {
          const size: "xl" | "lg" | "md" =
            idx === 0 ? "xl" : idx <= 2 ? "lg" : "md";
          const n = g.items.length;
          const cols =
            n === 1
              ? "grid-cols-1 max-w-md mx-auto"
              : n === 2
              ? "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto"
              : size === "xl"
              ? "grid-cols-1 md:grid-cols-2"
              : size === "lg"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

          return (
            <section key={g.key}>
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-[#1F2C3F]">{g.title}</h2>
                <div className="w-16 h-1 bg-[#A1532D] mx-auto mt-3 mb-3 rounded-full" />
                <p className="text-stone-500 text-sm">{g.subtitle}</p>
              </div>
              <div className={`grid ${cols} gap-6 justify-items-center`}>
                {g.items.map((p: any) => (
                  <PartnerCard key={p.id} p={p} size={size} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="bg-[#1F2C3F] text-white rounded-3xl p-10 md:p-14 text-center shadow-xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Devenez partenaire de Trail Tafaray
          </h2>
          <p className="text-stone-300 max-w-2xl mx-auto mb-8 leading-relaxed">{cta}</p>
          <a
            href={mailto}
            className="inline-block bg-[#A1532D] text-white px-10 py-3.5 rounded-full font-semibold hover:bg-[#8a4526] transition"
          >
            Devenir partenaire
          </a>
        </div>
      </section>
    </div>
  );
}

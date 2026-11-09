/** Présentation partenaires type trailtafaray.fianarako.io — cartes carrées centrées. */

export type PartnerItem = {
  id: string;
  nom: string;
  type?: string;
  logo_url?: string | null;
  site_url?: string | null;
  description?: string | null;
};

const GROUPS: { keys: string[]; title: string }[] = [
  { keys: ["organisateur"], title: "Organisateur" },
  { keys: ["technique", "partenaire_technique"], title: "Partenaire technique officiel" },
  { keys: ["sponsor_officiel"], title: "Sponsor officiel" },
  { keys: ["sponsor_principal"], title: "Sponsor principal" },
  { keys: ["partenaire_officiel", "officiel"], title: "Partenaire officiel" },
  { keys: ["institutionnel"], title: "Institutionnels" },
  { keys: ["logistique"], title: "Partenaires logistiques" },
  { keys: ["media"], title: "Partenaires médias" },
  { keys: ["autre", "partenaire"], title: "Partenaires" },
];

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 mb-8 max-w-4xl mx-auto">
      <div className="flex-1 h-px bg-stone-300/80" />
      <h3 className="text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-[#A1532D] whitespace-nowrap px-1">
        {title}
      </h3>
      <div className="flex-1 h-px bg-stone-300/80" />
    </div>
  );
}

function LogoCard({
  p,
  size = "md",
}: {
  p: PartnerItem;
  size?: "lg" | "md";
}) {
  const box =
    size === "lg"
      ? "w-[200px] h-[200px] sm:w-[220px] sm:h-[220px]"
      : "w-[140px] h-[140px] sm:w-[160px] sm:h-[160px]";
  const imgMax = size === "lg" ? "max-h-28 max-w-[9rem]" : "max-h-20 max-w-[7rem]";

  const inner = (
    <div
      className={`${box} bg-white rounded-2xl shadow-sm border border-stone-200/60 flex flex-col items-center justify-center p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}
    >
      {p.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.logo_url}
          alt={p.nom}
          className={`${imgMax} object-contain`}
        />
      ) : (
        <span className="text-sm font-semibold text-[#1F2C3F] text-center px-2 leading-snug">
          {p.nom}
        </span>
      )}
      {p.logo_url && (
        <span className="mt-3 text-[11px] sm:text-xs text-stone-500 text-center leading-tight px-1">
          {p.nom}
        </span>
      )}
    </div>
  );

  if (p.site_url) {
    return (
      <a href={p.site_url} target="_blank" rel="noopener noreferrer" className="inline-block">
        {inner}
      </a>
    );
  }
  return <div className="inline-block">{inner}</div>;
}

export function groupPartners(list: PartnerItem[]) {
  const used = new Set<string>();
  const sections = GROUPS.map((g) => {
    const items = list.filter((p) => g.keys.includes(String(p.type || "")));
    items.forEach((p) => used.add(p.id));
    return { title: g.title, items };
  }).filter((s) => s.items.length > 0);

  const rest = list.filter((p) => !used.has(p.id));
  if (rest.length) sections.push({ title: "Partenaires", items: rest });
  return sections;
}

/** Section complète page d'accueil ou page partenaires */
export default function PartnersShowcase({
  partenaires,
  variant = "home",
}: {
  partenaires: PartnerItem[];
  variant?: "home" | "page";
}) {
  if (!partenaires?.length) return null;
  const sections = groupPartners(partenaires);

  return (
    <div className={variant === "page" ? "space-y-16" : "space-y-14"}>
      {sections.map((section) => {
        const n = section.items.length;
        const size = n <= 2 ? "lg" : "md";
        return (
          <div key={section.title}>
            <SectionTitle title={section.title} />
            {/* flex + justify-center : 1 logo au milieu, N logos centrés */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
              {section.items.map((p) => (
                <LogoCard key={p.id} p={p} size={size as "lg" | "md"} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Présentation partenaires premium - cartes centrées avec mise en valeur. */

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

function SectionTitle({ title, dark }: { title: string; dark?: boolean }) {
  return (
    <div className="flex items-center gap-4 mb-8 max-w-4xl mx-auto">
      <div className={`flex-1 h-px ${dark ? "bg-gradient-to-r from-transparent via-[#d9a441]/60 to-[#d9a441]/20" : "bg-gradient-to-r from-transparent via-[#b7793d]/40 to-[#b7793d]/20"}`} />
      <h3
        className={`text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase whitespace-nowrap px-2 font-[family-name:var(--font-display)] ${
          dark ? "text-[#f0c96b]" : "text-[#b7793d]"
        }`}
      >
        {title}
      </h3>
      <div className={`flex-1 h-px ${dark ? "bg-gradient-to-l from-transparent via-[#d9a441]/60 to-[#d9a441]/20" : "bg-gradient-to-l from-transparent via-[#b7793d]/40 to-[#b7793d]/20"}`} />
    </div>
  );
}

function LogoCard({
  p,
  size = "md",
  dark,
}: {
  p: PartnerItem;
  size?: "lg" | "md";
  dark?: boolean;
}) {
  const box =
    size === "lg"
      ? "w-[190px] h-[190px] sm:w-[220px] sm:h-[220px]"
      : "w-[150px] h-[150px] sm:w-[168px] sm:h-[168px]";
  const imgMax = size === "lg" ? "max-h-28 max-w-[9.5rem]" : "max-h-20 max-w-[7.5rem]";

  const inner = (
    <div
      className={`${box} rounded-2xl flex flex-col items-center justify-center p-5 transition-all duration-300 group ${
        dark
          ? "bg-white/95 border border-[#d9a441]/20 shadow-[0_12px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_18px_40px_rgba(183,121,61,0.25)] hover:-translate-y-1"
          : "bg-white border border-[#b7793d]/15 shadow-[0_10px_30px_rgba(15,27,45,0.08)] hover:shadow-[0_18px_40px_rgba(183,121,61,0.18)] hover:-translate-y-1"
      }`}
    >
      <div className="absolute inset-x-6 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#d9a441] to-transparent opacity-0 group-hover:opacity-100 transition" />
      {p.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.logo_url} alt={p.nom} className={`${imgMax} object-contain`} />
      ) : (
        <span className="text-base font-semibold text-[#0f1b2d] text-center px-2 leading-snug font-[family-name:var(--font-display)]">
          {p.nom}
        </span>
      )}
      {p.logo_url && (
        <span className="mt-3 text-[11px] sm:text-xs text-[#0f1b2d]/80 text-center leading-tight px-1 font-medium tracking-wide font-[family-name:var(--font-display)]">
          {p.nom}
        </span>
      )}
    </div>
  );

  if (p.site_url) {
    return (
      <a href={p.site_url} target="_blank" rel="noopener noreferrer" className="inline-block relative">
        {inner}
      </a>
    );
  }
  return <div className="inline-block relative">{inner}</div>;
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

export default function PartnersShowcase({
  partenaires,
  variant = "home",
}: {
  partenaires: PartnerItem[];
  variant?: "home" | "page";
}) {
  if (!partenaires?.length) return null;
  const sections = groupPartners(partenaires);
  const dark = variant === "home";

  return (
    <div className={variant === "page" ? "space-y-16 sm:space-y-20" : "space-y-14 sm:space-y-16"}>
      {sections.map((section) => {
        const n = section.items.length;
        const size = n <= 2 ? "lg" : "md";
        return (
          <div key={section.title}>
            <SectionTitle title={section.title} dark={dark} />
            <div className="flex flex-wrap justify-center gap-5 sm:gap-7">
              {section.items.map((p) => (
                <LogoCard key={p.id} p={p} size={size as "lg" | "md"} dark={dark} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

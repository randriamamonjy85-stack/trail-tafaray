import Link from "next/link";
import Image from "next/image";
import Countdown from "@/components/Countdown";
import { getSettings, getTarifs } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const FALLBACK_COURSES = [
  { nom: "Zaza Tafaray", slug: "zaza-tafaray", distance: "5 KM", type_epreuve: "RUN", tarif: 15000, image_url: "" },
  { nom: "Trail Découverte", slug: "trail-decouverte", distance: "12 KM", type_epreuve: "RUN", tarif: 25000, image_url: "" },
  { nom: "Trail Endurance", slug: "trail-endurance", distance: "25 KM", type_epreuve: "RUN", tarif: 35000, image_url: "" },
  { nom: "Trail Intense", slug: "trail-intense", distance: "35 KM", type_epreuve: "RUN", tarif: 45000, image_url: "" },
  { nom: "VTT BEKA", slug: "vtt-beka", distance: "31 KM", type_epreuve: "BIKE", tarif: 40000, image_url: "" },
  { nom: "Duathlon Nature", slug: "duathlon-nature", distance: "24 KM", type_epreuve: "RUN · BIKE", tarif: 50000, image_url: "" },
];

const PARTNER_GROUPS: { keys: string[]; title: string }[] = [
  { keys: ["sponsor_officiel"], title: "Sponsors officiels" },
  { keys: ["sponsor_principal"], title: "Sponsors principaux" },
  { keys: ["partenaire_officiel", "officiel"], title: "Partenaires officiels" },
  { keys: ["institutionnel"], title: "Partenaires institutionnels" },
  { keys: ["technique"], title: "Partenaires techniques" },
  { keys: ["logistique"], title: "Partenaires logistiques" },
  { keys: ["media"], title: "Partenaires médias" },
  { keys: ["autre"], title: "Autres partenaires" },
];

export default async function Home() {
  const settings = await getSettings();
  const tarifs = getTarifs(settings);
  const supabase = await createClient();

  let courses: any[] = [];
  try {
    const { data } = await supabase
      .from("courses")
      .select("*")
      .eq("active", true)
      .order("ordre");
    courses = data && data.length ? data : FALLBACK_COURSES;
  } catch {
    courses = FALLBACK_COURSES;
  }

  let partenaires: any[] = [];
  let photos: any[] = [];
  try {
    if (settings.partenaires_visibles) {
      const { data } = await supabase
        .from("partenaires")
        .select("*")
        .eq("visible", true)
        .order("ordre");
      partenaires = data || [];
    }
    const { data: ph } = await supabase
      .from("photos")
      .select("*")
      .eq("visible", true)
      .order("ordre")
      .limit(8);
    photos = ph || [];
  } catch {
    /* ignore */
  }

  const dateAffichee = settings.date_evenement
    ? new Date(settings.date_evenement).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Dimanche 24 octobre 2027";

  const heroBg =
    (settings as any).hero_image_url ||
    "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=2000&q=80";

  const emailPart = (settings as any).email_partenariat || "trailtafaray@gmail.com";
  const mailto = `mailto:${emailPart}?subject=${encodeURIComponent("Demande de partenariat – Association Trail Tafaray")}`;

  const used = new Set<string>();
  const partnerSections = PARTNER_GROUPS.map((g) => {
    const items = partenaires.filter((p) => g.keys.includes(p.type));
    items.forEach((p) => used.add(p.id));
    return { title: g.title, items };
  }).filter((s) => s.items.length > 0);
  const rest = partenaires.filter((p) => !used.has(p.id));
  if (rest.length) partnerSections.push({ title: "Partenaires", items: rest });

  return (
    <div className="overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-[85vh] flex items-center justify-center bg-[#1F2C3F] text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-[8s] hover:scale-110"
          style={{ backgroundImage: `url('${heroBg}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1F2C3F]/80 via-[#1F2C3F]/55 to-[#1F2C3F]/90" />
        <div className="relative z-10 text-center px-4 max-w-4xl py-20 animate-[fadeUp_0.8s_ease-out]">
          <Image
            src="/logo-tafaray.png"
            alt="Trail Tafaray"
            width={120}
            height={120}
            className="mx-auto mb-6 h-24 w-auto drop-shadow-lg"
          />
          <p className="text-[#A1532D] text-xs sm:text-sm tracking-[0.25em] uppercase mb-4 font-semibold">
            RUN · BIKE · ANJEVA
          </p>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            {settings.hero_titre || "Trail Tafaray"}
          </h1>
          <p className="text-base sm:text-xl text-stone-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            {settings.hero_sous_titre}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            {settings.inscriptions_ouvertes ? (
              <Link
                href="/inscription"
                className="bg-[#A1532D] text-white px-8 py-3.5 rounded-full font-semibold text-base sm:text-lg hover:bg-[#8a4526] hover:scale-[1.03] active:scale-[0.98] transition-all shadow-lg shadow-[#A1532D]/25"
              >
                S&apos;inscrire maintenant
              </Link>
            ) : (
              <span className="bg-stone-500 text-white px-8 py-3.5 rounded-full font-semibold">
                Inscriptions fermées
              </span>
            )}
            <Link
              href="/courses"
              className="border border-white/40 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-white/10 hover:border-white/70 transition-all"
            >
              Découvrir les courses
            </Link>
          </div>
        </div>
      </section>

      {/* COUNTDOWN */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[#A1532D] text-xs tracking-widest uppercase font-semibold mb-2">
            Prochain rendez-vous
          </p>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#1F2C3F] mb-2">
            Compte à rebours
          </h2>
          <p className="text-stone-600 mb-1 capitalize">{dateAffichee}</p>
          <p className="text-stone-500 mb-10">{settings.lieu_evenement}</p>
          <Countdown
            targetDate={settings.date_evenement || "2027-10-24T06:00:00+03:00"}
          />
        </div>
      </section>

      {/* COURSES */}
      <section className="py-16 sm:py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[#A1532D] text-xs tracking-widest uppercase font-semibold mb-2">
              Formats
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#1F2C3F] mb-3">
              Les courses
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto text-sm sm:text-base">
              {settings.texte_courses ||
                "Six formats pour tous les niveaux, du trail découverte au duathlon nature."}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {courses.map((c) => {
              const prix = Number(c.tarif) || tarifs[c.nom] || 0;
              const slug = c.slug || "detail";
              return (
                <article
                  key={c.id || c.nom}
                  className="group bg-white rounded-2xl border border-stone-200/80 overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative h-44 overflow-hidden bg-[#1F2C3F]">
                    {c.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.image_url}
                        alt={c.nom}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1F2C3F] to-[#3d4f66] flex items-center justify-center">
                        <span className="text-white/70 text-sm tracking-wide">
                          {c.type_epreuve || "TRAIL"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 sm:p-6 flex flex-col flex-1">
                    <div className="text-xs font-semibold text-[#A1532D] mb-1 tracking-wide">
                      {c.type_epreuve || "RUN"}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#1F2C3F] mb-1">
                      {c.nom}
                    </h3>
                    <p className="text-2xl font-bold text-stone-800 mb-1">{c.distance}</p>
                    {c.denivele && (
                      <p className="text-sm text-stone-500 mb-1">D+ {c.denivele}</p>
                    )}
                    <p className="text-sm font-medium text-[#A1532D] mb-4">
                      {prix.toLocaleString("fr-MG")} Ar
                    </p>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Link
                        href={`/courses/${slug}`}
                        className="inline-block border border-stone-300 px-4 py-2 rounded-full text-sm font-medium hover:bg-stone-50 transition"
                      >
                        En savoir plus
                      </Link>
                      {settings.inscriptions_ouvertes && (
                        <Link
                          href={`/inscription?course=${encodeURIComponent(c.nom)}`}
                          className="inline-block bg-[#A1532D] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#8a4526] transition"
                        >
                          S&apos;inscrire
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* GALERIE */}
      {photos.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-8 gap-4">
              <div>
                <p className="text-[#A1532D] text-xs tracking-widest uppercase font-semibold mb-1">
                  Moments
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1F2C3F]">Galerie</h2>
              </div>
              <Link href="/galerie" className="text-sm text-[#A1532D] hover:underline shrink-0">
                Voir tout →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {photos.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id}
                  src={p.url}
                  alt={p.titre || ""}
                  className="w-full h-36 sm:h-44 object-cover rounded-xl hover:opacity-90 hover:scale-[1.02] transition duration-300"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PARTENAIRES / SPONSORS hiérarchisés */}
      {settings.partenaires_visibles && partnerSections.length > 0 && (
        <section className="py-16 sm:py-20 bg-stone-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-[#A1532D] text-xs tracking-widest uppercase font-semibold mb-2">
                Ils nous soutiennent
              </p>
              <h2 className="text-2xl sm:text-4xl font-bold text-[#1F2C3F] mb-2">
                Sponsors & partenaires
              </h2>
              <Link href="/partenaires" className="text-sm text-[#A1532D] hover:underline">
                Voir tous les partenaires →
              </Link>
            </div>

            <div className="space-y-12">
              {partnerSections.map((section) => {
                const n = section.items.length;
                const gridCls =
                  n === 1
                    ? "grid grid-cols-1 max-w-xs mx-auto"
                    : n === 2
                    ? "grid grid-cols-2 max-w-lg mx-auto gap-4"
                    : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 justify-items-center";
                return (
                  <div key={section.title}>
                    <h3 className="text-center text-sm font-semibold tracking-wide text-[#1F2C3F] uppercase mb-5">
                      {section.title}
                    </h3>
                    <div className={gridCls}>
                      {section.items.map((p: any) => {
                        const card = (
                          <div className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col items-center justify-center min-h-[7rem] w-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            {p.logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.logo_url}
                                alt={p.nom}
                                className="max-h-14 object-contain"
                              />
                            ) : (
                              <span className="text-sm font-medium text-center text-[#1F2C3F]">
                                {p.nom}
                              </span>
                            )}
                          </div>
                        );
                        return p.site_url ? (
                          <a
                            key={p.id}
                            href={p.site_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full"
                          >
                            {card}
                          </a>
                        ) : (
                          <div key={p.id} className="w-full">
                            {card}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-14 bg-[#1F2C3F] text-white rounded-3xl p-8 sm:p-10 text-center shadow-lg">
              <h3 className="text-xl sm:text-2xl font-bold mb-3">
                Devenez partenaire de Trail Tafaray
              </h3>
              <p className="text-stone-300 text-sm max-w-xl mx-auto mb-6">
                {(settings as any).texte_partenaires_cta ||
                  "Soutenez nos événements et associez votre image à Trail Tafaray."}
              </p>
              <a
                href={mailto}
                className="inline-block bg-[#A1532D] px-7 py-3 rounded-full font-semibold text-sm hover:bg-[#8a4526] transition"
              >
                Devenir partenaire
              </a>
            </div>
          </div>
        </section>
      )}

      {/* CTA final */}
      <section className="py-16 sm:py-20 bg-[#1F2C3F] text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Prêt pour l&apos;aventure ?</h2>
          <p className="text-stone-300 mb-8">
            Rejoignez-nous sur les sentiers d&apos;Anjeva.
          </p>
          {settings.inscriptions_ouvertes ? (
            <Link
              href="/inscription"
              className="inline-block bg-[#A1532D] text-white px-8 py-3.5 rounded-full font-semibold hover:bg-[#8a4526] hover:scale-[1.03] transition-all"
            >
              S&apos;inscrire
            </Link>
          ) : (
            <span className="inline-block bg-stone-600 text-white px-8 py-3.5 rounded-full font-semibold">
              Inscriptions fermées
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

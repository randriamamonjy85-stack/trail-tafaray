import Link from "next/link";
import Image from "next/image";
import Countdown from "@/components/Countdown";
import { getSettings, getTarifs } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import PartnersShowcase from "@/components/PartnersShowcase";

export const dynamic = "force-dynamic";

const FALLBACK_COURSES = [
  { nom: "Zaza Tafaray", slug: "zaza-tafaray", distance: "5 KM", type_epreuve: "RUN", tarif: 15000, image_url: "" },
  { nom: "Trail Découverte", slug: "trail-decouverte", distance: "12 KM", type_epreuve: "RUN", tarif: 25000, image_url: "" },
  { nom: "Trail Endurance", slug: "trail-endurance", distance: "25 KM", type_epreuve: "RUN", tarif: 35000, image_url: "" },
  { nom: "Trail Intense", slug: "trail-intense", distance: "35 KM", type_epreuve: "RUN", tarif: 45000, image_url: "" },
  { nom: "VTT BEKA", slug: "vtt-beka", distance: "31 KM", type_epreuve: "BIKE", tarif: 40000, image_url: "" },
  { nom: "Duathlon Nature", slug: "duathlon-nature", distance: "24 KM", type_epreuve: "RUN · BIKE", tarif: 50000, image_url: "" },
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

    return (
    <div className="overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-[92vh] flex items-center justify-center bg-[#0f1b2d] text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url('${heroBg}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1b2d]/85 via-[#0f1b2d]/60 to-[#0f1b2d]/95" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_400px_at_70%_10%,rgba(217,164,65,0.18),transparent_60%)]" />
        <div className="relative z-10 text-center px-4 max-w-5xl py-24 animate-[fadeUp_0.8s_ease-out]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 mb-8 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d9a441]" />
            <span className="text-xs sm:text-sm tracking-[0.18em] uppercase text-stone-200">Run · Bike · Anjeva</span>
          </div>
          <Image
            src="/logo-tafaray.png"
            alt="Trail Tafaray"
            width={140}
            height={140}
            className="mx-auto mb-8 h-24 sm:h-28 w-auto drop-shadow-2xl"
          />
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight mb-6 leading-[1.05]">
            {settings.hero_titre || "Trail Tafaray"}
          </h1>
          <p className="text-base sm:text-xl text-stone-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            {settings.hero_sous_titre}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {settings.inscriptions_ouvertes ? (
              <Link
                href="/inscription"
                className="bg-gradient-to-r from-[#b7793d] to-[#d9a441] text-[#0f1b2d] px-9 py-3.5 rounded-full font-semibold text-base sm:text-lg hover:brightness-110 hover:-translate-y-0.5 transition-all shadow-xl shadow-black/25"
              >
                S&apos;inscrire maintenant
              </Link>
            ) : (
              <span className="bg-white/10 border border-white/15 text-white px-9 py-3.5 rounded-full font-semibold backdrop-blur">
                Inscriptions fermées
              </span>
            )}
            <Link
              href="/courses"
              className="border border-white/25 text-white px-9 py-3.5 rounded-full font-semibold hover:bg-white/10 hover:border-white/40 transition-all backdrop-blur"
            >
              Découvrir les courses
            </Link>
          </div>
        </div>
      </section>

      {/* COUNTDOWN */}
<<<<<<< HEAD
      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
=======
      <section className="relative py-20 sm:py-24 overflow-hidden">
        {(settings as any).countdown_bg_url ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${(settings as any).countdown_bg_url}')` }}
            />
            <div className="absolute inset-0 bg-[#f8f7f4]/80 backdrop-blur-[1px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-[#f8f7f4]/90" />
          </>
        ) : null}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
>>>>>>> caef917 (Ajout images evenement, fond compte a rebours et fonds courses)
          <p className="section-kicker mb-3">Prochain rendez-vous</p>
          <h2 className="text-3xl sm:text-5xl font-semibold text-[#0f1b2d] mb-3 tracking-tight">
            Compte à rebours
          </h2>
          <p className="text-stone-700 mb-1 capitalize">{dateAffichee}</p>
          <p className="text-stone-500 mb-12">{settings.lieu_evenement}</p>
          <Countdown
            targetDate={settings.date_evenement || "2027-10-24T06:00:00+03:00"}
          />
        </div>
      </section>

      {/* COURSES */}
      <section className="py-20 sm:py-24 relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
            <div>
              <p className="section-kicker mb-3">Formats</p>
              <h2 className="text-3xl sm:text-5xl font-semibold text-[#0f1b2d] mb-3 tracking-tight">
                Les courses
              </h2>
              <p className="text-stone-600 max-w-2xl text-sm sm:text-base leading-relaxed">
                {settings.texte_courses ||
                  "Six formats pour tous les niveaux, du trail découverte au duathlon nature."}
              </p>
            </div>
            <Link href="/courses" className="text-sm font-medium text-[#b7793d] hover:text-[#0f1b2d] transition shrink-0">
              Voir toutes les courses →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => {
              const prix = Number(c.tarif) || tarifs[c.nom] || 0;
              const slug = c.slug || "detail";
              return (
                <article
                  key={c.id || c.nom}
                  className="group premium-card rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
                >
                  <div className="relative h-52 overflow-hidden bg-[#0f1b2d]">
                    {c.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.image_url}
                        alt={c.nom}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#0f1b2d] via-[#18263b] to-[#243955] flex items-center justify-center">
                        <span className="text-white/70 text-sm tracking-[0.18em] uppercase">
                          {c.type_epreuve || "TRAIL"}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1b2d]/50 to-transparent" />
                    <div className="absolute top-4 left-4 rounded-full bg-white/10 backdrop-blur border border-white/20 px-3 py-1 text-xs font-medium text-white tracking-wide">
                      {c.type_epreuve || "RUN"}
                    </div>
                  </div>
                  <div className="p-6 sm:p-7 flex flex-col flex-1">
                    <h3 className="text-xl sm:text-2xl font-semibold text-[#0f1b2d] mb-2 tracking-tight">
                      {c.nom}
                    </h3>
                    <div className="flex items-baseline gap-3 mb-2">
                      <p className="text-2xl font-bold text-[#0f1b2d]">{c.distance}</p>
                      {c.denivele && <p className="text-sm text-stone-500">D+ {c.denivele}</p>}
                    </div>
                    <p className="text-sm font-semibold text-[#b7793d] mb-6">
                      {prix.toLocaleString("fr-MG")} Ar
                    </p>
                    <div className="mt-auto flex flex-wrap gap-3">
                      <Link
                        href={`/courses/${slug}`}
                        className="inline-flex items-center border border-stone-300/80 px-4 py-2.5 rounded-full text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-400 transition"
                      >
                        Détails
                      </Link>
                      {settings.inscriptions_ouvertes && (
                        <Link
                          href={`/inscription?course=${encodeURIComponent(c.nom)}`}
                          className="inline-flex items-center bg-[#0f1b2d] text-white px-4 py-2.5 rounded-full text-sm font-medium hover:bg-[#18263b] transition"
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
        <section className="py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-10 gap-4">
              <div>
                <p className="section-kicker mb-2">Moments</p>
                <h2 className="text-3xl sm:text-4xl font-semibold text-[#0f1b2d] tracking-tight">Galerie</h2>
              </div>
              <Link href="/galerie" className="text-sm font-medium text-[#b7793d] hover:text-[#0f1b2d] transition shrink-0">
                Voir tout →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id}
                  src={p.url}
                  alt={p.titre || ""}
                  className="w-full h-40 sm:h-52 object-cover rounded-2xl hover:opacity-95 hover:scale-[1.02] transition duration-500 shadow-sm"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {settings.partenaires_visibles && partenaires.length > 0 && (
        <section className="py-20 sm:py-24 bg-gradient-to-b from-white to-[#f3efe8]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="section-kicker mb-3">Ils nous soutiennent</p>
              <h2 className="text-3xl sm:text-5xl font-semibold text-[#0f1b2d] mb-4 tracking-tight">
                Nos partenaires
              </h2>
              <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                Merci aux organisations qui rendent le Trail Tafaray possible, du départ jusqu&apos;à la ligne d&apos;arrivée.
              </p>
              <Link href="/partenaires" className="inline-block mt-5 text-sm font-medium text-[#b7793d] hover:text-[#0f1b2d] transition">
                Voir tous les partenaires →
              </Link>
            </div>
            <PartnersShowcase partenaires={partenaires} variant="home" />
            <div className="mt-16 text-center">
              <a
                href={mailto}
                className="inline-flex bg-[#0f1b2d] text-white px-8 py-3.5 rounded-full font-semibold text-sm hover:bg-[#18263b] transition shadow-lg shadow-black/10"
              >
                Devenir partenaire
              </a>
            </div>
          </div>
        </section>
      )}

      {/* CTA final */}
      <section className="relative py-20 sm:py-24 bg-[#0f1b2d] text-white text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(700px_300px_at_50%_0%,rgba(217,164,65,0.2),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto px-4">
          <p className="text-[#d9a441] text-xs tracking-[0.22em] uppercase font-semibold mb-4">Rejoignez-nous</p>
          <h2 className="text-3xl sm:text-5xl font-semibold mb-5 tracking-tight">Prêt pour l&apos;aventure ?</h2>
          <p className="text-stone-300 mb-10 text-base sm:text-lg">
            Rejoignez-nous sur les sentiers d&apos;Anjeva.
          </p>
          {settings.inscriptions_ouvertes ? (
            <Link
              href="/inscription"
              className="inline-block bg-gradient-to-r from-[#b7793d] to-[#d9a441] text-[#0f1b2d] px-10 py-4 rounded-full font-semibold hover:brightness-110 transition-all shadow-xl shadow-black/25"
            >
              S&apos;inscrire
            </Link>
          ) : (
            <span className="inline-block bg-white/10 border border-white/15 text-white px-10 py-4 rounded-full font-semibold backdrop-blur">
              Inscriptions fermées
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

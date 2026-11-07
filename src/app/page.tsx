import Link from "next/link";
import Image from "next/image";
import Countdown from "@/components/Countdown";
import { getSettings, getTarifs } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getSettings();
  const tarifs = getTarifs(settings);
  const supabase = await createClient();

  const courses = [
    { name: "Zaza Tafaray", distance: "5 KM", type: "RUN" },
    { name: "Trail Découverte", distance: "12 KM", type: "RUN" },
    { name: "Trail Endurance", distance: "25 KM", type: "RUN" },
    { name: "Trail Intense", distance: "35 KM", type: "RUN" },
    { name: "VTT BEKA", distance: "31 KM", type: "BIKE" },
    { name: "Duathlon Nature", distance: "24 KM", type: "RUN · BIKE" },
  ];

  let partenaires: any[] = [];
  let photos: any[] = [];
  try {
    if (settings.partenaires_visibles) {
      const { data } = await supabase
        .from("partenaires")
        .select("*")
        .eq("visible", true)
        .order("ordre")
        .limit(8);
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
    <div>
      <section className="relative h-[75vh] min-h-[520px] flex items-center justify-center bg-[#1F2C3F] text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 bg-cover bg-center"
          style={{ backgroundImage: `url('${heroBg}')` }}
        />
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <Image
            src="/logo-tafaray.png"
            alt="Trail Tafaray"
            width={120}
            height={120}
            className="mx-auto mb-6 h-24 w-auto"
          />
          <p className="text-[#A1532D] text-sm tracking-widest uppercase mb-4 font-medium">
            RUN · BIKE
          </p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            {settings.hero_titre || "Trail Tafaray"}
          </h1>
          <p className="text-xl md:text-2xl text-stone-200 mb-8 max-w-2xl mx-auto">
            {settings.hero_sous_titre}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {settings.inscriptions_ouvertes ? (
              <Link
                href="/inscription"
                className="bg-[#A1532D] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#8a4526] transition"
              >
                S&apos;inscrire maintenant
              </Link>
            ) : (
              <span className="bg-stone-500 text-white px-8 py-4 rounded-full font-semibold text-lg">
                Inscriptions fermées
              </span>
            )}
            <Link
              href="/courses"
              className="border border-white/40 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition"
            >
              Découvrir les courses
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1F2C3F] mb-4">
            Prochain rendez-vous
          </h2>
          <p className="text-xl text-stone-600 mb-2 capitalize">{dateAffichee}</p>
          <p className="text-lg text-stone-500 mb-12">{settings.lieu_evenement}</p>
          <Countdown
            targetDate={settings.date_evenement || "2027-10-24T06:00:00+03:00"}
          />
        </div>
      </section>

      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#1F2C3F] mb-4">
            Les courses
          </h2>
          <p className="text-center text-stone-600 mb-12 max-w-2xl mx-auto">
            {settings.texte_courses ||
              "Six formats pour tous les niveaux, du trail découverte au duathlon nature."}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => (
              <div
                key={c.name}
                className="bg-white rounded-2xl p-6 border border-stone-200"
              >
                <div className="text-sm font-medium text-[#A1532D] mb-2">{c.type}</div>
                <h3 className="text-xl font-bold text-[#1F2C3F] mb-2">{c.name}</h3>
                <p className="text-2xl font-bold text-stone-800 mb-2">{c.distance}</p>
                <p className="text-sm font-medium text-[#A1532D] mb-4">
                  {(tarifs[c.name] || 0).toLocaleString("fr-MG")} Ar
                </p>
                {settings.inscriptions_ouvertes && (
                  <Link
                    href={`/inscription?course=${encodeURIComponent(c.name)}`}
                    className="text-sm font-medium text-[#1F2C3F] hover:underline"
                  >
                    S&apos;inscrire →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {photos.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-3xl font-bold text-[#1F2C3F]">Galerie</h2>
              <Link href="/galerie" className="text-sm text-[#A1532D] hover:underline">
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
                  className="w-full h-40 object-cover rounded-xl"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {settings.partenaires_visibles && (
        <section className="py-16 bg-stone-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-3xl font-bold text-[#1F2C3F]">Partenaires</h2>
              <Link href="/partenaires" className="text-sm text-[#A1532D] hover:underline">
                Tous les partenaires →
              </Link>
            </div>
            {partenaires.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                {partenaires.map((p) =>
                  p.site_url ? (
                    <a
                      key={p.id}
                      href={p.site_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white rounded-xl border border-stone-200 p-4 flex items-center justify-center h-28 hover:shadow-md"
                    >
                      {p.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.logo_url} alt={p.nom} className="max-h-16 object-contain" />
                      ) : (
                        <span className="text-sm font-medium text-center">{p.nom}</span>
                      )}
                    </a>
                  ) : (
                    <div
                      key={p.id}
                      className="bg-white rounded-xl border border-stone-200 p-4 flex items-center justify-center h-28"
                    >
                      {p.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.logo_url} alt={p.nom} className="max-h-16 object-contain" />
                      ) : (
                        <span className="text-sm font-medium text-center">{p.nom}</span>
                      )}
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-stone-500 mb-8">Partenaires à venir.</p>
            )}
            <div className="bg-[#1F2C3F] text-white rounded-2xl p-8 text-center">
              <h3 className="text-xl font-bold mb-3">Devenez partenaire de Trail Tafaray</h3>
              <p className="text-stone-300 text-sm max-w-xl mx-auto mb-6">
                {(settings as any).texte_partenaires_cta ||
                  "Soutenez nos événements et associez votre image à Trail Tafaray."}
              </p>
              <a
                href={mailto}
                className="inline-block bg-[#A1532D] px-6 py-3 rounded-full font-semibold text-sm hover:bg-[#8a4526]"
              >
                Devenir partenaire
              </a>
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-[#1F2C3F] text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Prêt pour l&apos;aventure ?</h2>
          <p className="text-stone-300 mb-8">
            Rejoignez-nous sur les sentiers d&apos;Anjeva.
          </p>
          {settings.inscriptions_ouvertes ? (
            <Link
              href="/inscription"
              className="inline-block bg-[#A1532D] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#8a4526]"
            >
              S&apos;inscrire
            </Link>
          ) : (
            <span className="inline-block bg-stone-600 text-white px-8 py-4 rounded-full font-semibold">
              Inscriptions fermées
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

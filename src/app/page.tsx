import Link from "next/link";
import Image from "next/image";
import Countdown from "@/components/Countdown";
import { getSettings, getTarifs } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getSettings();
  const tarifs = getTarifs(settings);

  const courses = [
    { name: "Zaza Tafaray", distance: "5 KM", type: "RUN" },
    { name: "Trail Découverte", distance: "12 KM", type: "RUN" },
    { name: "Trail Endurance", distance: "25 KM", type: "RUN" },
    { name: "Trail Intense", distance: "35 KM", type: "RUN" },
    { name: "VTT BEKA", distance: "31 KM", type: "BIKE" },
    { name: "Duathlon Nature", distance: "24 KM", type: "RUN · BIKE" },
  ];

  const dateAffichee = settings.date_evenement
    ? new Date(settings.date_evenement).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Dimanche 24 octobre 2027";

  return (
    <div>
      <section className="relative h-[75vh] min-h-[520px] flex items-center justify-center bg-[#1F2C3F] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center" />
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <Image src="/logo-tafaray.png" alt="Trail Tafaray" width={120} height={120} className="mx-auto mb-6 h-24 w-auto" />
          <p className="text-[#A1532D] text-sm tracking-widest uppercase mb-4 font-medium">RUN · BIKE</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            {settings.hero_titre || "Trail Tafaray"}
          </h1>
          <p className="text-xl md:text-2xl text-stone-200 mb-8 max-w-2xl mx-auto">
            {settings.hero_sous_titre}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {settings.inscriptions_ouvertes ? (
              <Link href="/inscription" className="bg-[#A1532D] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#8a4526] transition">
                S&apos;inscrire maintenant
              </Link>
            ) : (
              <span className="bg-stone-500 text-white px-8 py-4 rounded-full font-semibold text-lg">
                Inscriptions fermées
              </span>
            )}
            <Link href="/courses" className="border border-white/40 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition">
              Découvrir les courses
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1F2C3F] mb-4">Prochain rendez-vous</h2>
          <p className="text-xl text-stone-600 mb-2 capitalize">{dateAffichee}</p>
          <p className="text-lg text-stone-500 mb-12">{settings.lieu_evenement}</p>
          <Countdown targetDate={settings.date_evenement || "2027-10-24T06:00:00+03:00"} />
        </div>
      </section>

      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#1F2C3F] mb-4">Les courses</h2>
          <p className="text-center text-stone-600 mb-12 max-w-2xl mx-auto">
            {settings.texte_courses || "Six formats pour tous les niveaux, du trail découverte au duathlon nature."}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => (
              <div key={c.name} className="bg-white rounded-2xl p-6 border border-stone-200">
                <div className="text-sm font-medium text-[#A1532D] mb-2">{c.type}</div>
                <h3 className="text-xl font-bold text-[#1F2C3F] mb-2">{c.name}</h3>
                <p className="text-2xl font-bold text-stone-800 mb-2">{c.distance}</p>
                <p className="text-sm font-medium text-[#A1532D] mb-4">
                  {(tarifs[c.name] || 0).toLocaleString("fr-MG")} Ar
                </p>
                {settings.inscriptions_ouvertes && (
                  <Link href="/inscription" className="text-sm font-medium text-[#1F2C3F] hover:underline">
                    S&apos;inscrire →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#1F2C3F] text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Prêt pour l&apos;aventure ?</h2>
          <p className="text-stone-300 mb-8">Rejoignez-nous sur les sentiers d&apos;Anjeva.</p>
          {settings.inscriptions_ouvertes ? (
            <Link href="/inscription" className="inline-block bg-[#A1532D] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#8a4526]">
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

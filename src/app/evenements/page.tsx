import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function EvenementsPage() {
  const settings = await getSettings();
  const dateAffichee = settings.date_evenement
    ? new Date(settings.date_evenement).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Dimanche 24 octobre 2027";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-[#1F2C3F] mb-6">Événements</h1>
      <div className="bg-white rounded-2xl border border-stone-200 p-8">
        <h2 className="text-2xl font-bold text-[#1F2C3F] mb-2">Trail Tafaray</h2>
        <p className="text-[#A1532D] font-medium mb-1 capitalize">{dateAffichee}</p>
        <p className="text-stone-600 mb-6">{settings.lieu_evenement}</p>
        <p className="text-stone-700 leading-relaxed whitespace-pre-line">
          {settings.texte_evenements ||
            "Une journée de trail et VTT au cœur des paysages d’Anjeva. Plusieurs formats pour tous les niveaux, ambiance conviviale et sentiers authentiques."}
        </p>
      </div>
    </div>
  );
}

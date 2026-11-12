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
  const imageUrl = (settings as any).evenement_image_url as string | undefined;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="mb-10">
        <p className="section-kicker mb-3">Rendez-vous</p>
        <h1 className="text-4xl sm:text-5xl font-semibold text-[#0f1b2d] tracking-tight">Événements</h1>
      </div>
      <div className={`grid gap-8 items-stretch ${imageUrl ? "lg:grid-cols-[1.1fr_0.9fr]" : ""}`}>
        <div className="premium-card rounded-3xl p-8 sm:p-10">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#0f1b2d] mb-3 tracking-tight">Trail Tafaray</h2>
          <p className="text-[#b7793d] font-medium mb-1 capitalize">{dateAffichee}</p>
          <p className="text-stone-500 mb-6">{settings.lieu_evenement}</p>
          <p className="text-stone-700 leading-relaxed whitespace-pre-line">
            {settings.texte_evenements ||
              "Une journée de trail et VTT au cœur des paysages d'Anjeva. Plusieurs formats pour tous les niveaux, ambiance conviviale et sentiers authentiques."}
          </p>
        </div>
        {imageUrl && (
          <div className="relative min-h-[280px] lg:min-h-full rounded-3xl overflow-hidden shadow-lg shadow-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Événement Trail Tafaray" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        )}
      </div>
    </div>
  );
}

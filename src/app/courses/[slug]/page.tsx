import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const settings = await getSettings();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  let c = course;
  if (!c) {
    const { data: all } = await supabase.from("courses").select("*").eq("active", true);
    c = (all || []).find((x: any) => x.slug === slug) || null;
  }

  if (!c) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold text-[#0f1b2d] mb-4 tracking-tight">Course introuvable</h1>
        <Link href="/courses" className="text-[#b7793d] hover:underline font-medium">
          Retour aux courses
        </Link>
      </div>
    );
  }

  return (
    <div>
      <section className="relative min-h-[46vh] flex items-end overflow-hidden bg-[#0f1b2d]">
        {c.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.image_url} alt={c.nom} className="absolute inset-0 w-full h-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1b2d] via-[#0f1b2d]/60 to-[#0f1b2d]/20" />
        <div className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 pb-12 pt-28">
          <Link href="/courses" className="inline-flex text-sm text-stone-300 hover:text-white transition mb-6">
            ← Toutes les courses
          </Link>
          <p className="text-[#d9a441] text-xs tracking-[0.2em] uppercase font-semibold mb-3">{c.type_epreuve || "Course"}</p>
          <h1 className="text-4xl sm:text-6xl font-semibold text-white mb-3 tracking-tight">{c.nom}</h1>
          <p className="text-stone-200 font-medium text-lg">
            {c.distance}
            {c.denivele ? ` · D+ ${c.denivele}` : ""}
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="premium-card rounded-2xl p-5">
            <div className="text-xs uppercase tracking-[0.14em] text-stone-500 mb-1">Tarif</div>
            <div className="font-semibold text-[#0f1b2d] text-lg">{Number(c.tarif || 0).toLocaleString("fr-MG")} Ar</div>
          </div>
          <div className="premium-card rounded-2xl p-5">
            <div className="text-xs uppercase tracking-[0.14em] text-stone-500 mb-1">Départ</div>
            <div className="font-semibold text-[#0f1b2d] text-lg">{c.heure_depart || "—"}</div>
          </div>
          <div className="premium-card rounded-2xl p-5">
            <div className="text-xs uppercase tracking-[0.14em] text-stone-500 mb-1">Niveau</div>
            <div className="font-semibold text-[#0f1b2d] text-lg">{c.niveau || "—"}</div>
          </div>
          <div className="premium-card rounded-2xl p-5">
            <div className="text-xs uppercase tracking-[0.14em] text-stone-500 mb-1">T-shirt</div>
            <div className="font-semibold text-[#0f1b2d] text-lg">{c.tee_shirt ? "Oui" : "Non"}</div>
          </div>
        </div>

        <div className="grid gap-8">
          {c.description && (
            <section className="premium-card rounded-3xl p-7 sm:p-8">
              <h2 className="text-xl font-semibold text-[#0f1b2d] mb-3 tracking-tight">Description</h2>
              <p className="text-stone-700 leading-relaxed whitespace-pre-line">{c.description}</p>
            </section>
          )}
          {c.historique && (
            <section className="premium-card rounded-3xl p-7 sm:p-8">
              <h2 className="text-xl font-semibold text-[#0f1b2d] mb-3 tracking-tight">Historique</h2>
              <p className="text-stone-700 leading-relaxed whitespace-pre-line">{c.historique}</p>
            </section>
          )}
          {c.particularites && (
            <section className="premium-card rounded-3xl p-7 sm:p-8">
              <h2 className="text-xl font-semibold text-[#0f1b2d] mb-3 tracking-tight">Particularités</h2>
              <p className="text-stone-700 leading-relaxed whitespace-pre-line">{c.particularites}</p>
            </section>
          )}
          {c.conditions && (
            <section className="premium-card rounded-3xl p-7 sm:p-8">
              <h2 className="text-xl font-semibold text-[#0f1b2d] mb-3 tracking-tight">Conditions</h2>
              <p className="text-stone-700 leading-relaxed whitespace-pre-line">{c.conditions}</p>
            </section>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 mb-10">
          {c.carte_url && (
            <div className="premium-card rounded-3xl p-5">
              <h3 className="font-medium text-[#0f1b2d] mb-3">Carte</h3>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.carte_url} alt="Carte" className="rounded-xl w-full" />
            </div>
          )}
          {c.profil_url && (
            <div className="premium-card rounded-3xl p-5">
              <h3 className="font-medium text-[#0f1b2d] mb-3">Profil altimétrique</h3>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.profil_url} alt="Profil" className="rounded-xl w-full" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {c.gpx_url && (
            <a href={c.gpx_url} className="border border-stone-300/80 px-6 py-3 rounded-full text-sm font-medium text-stone-700 hover:bg-stone-50 transition" download>
              Télécharger le GPX
            </a>
          )}
          {settings.inscriptions_ouvertes && (
            <Link
              href={`/inscription?course=${encodeURIComponent(c.nom)}`}
              className="bg-gradient-to-r from-[#b7793d] to-[#d9a441] text-[#0f1b2d] px-7 py-3 rounded-full text-sm font-semibold hover:brightness-110 transition shadow-lg shadow-black/10"
            >
              S&apos;inscrire
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
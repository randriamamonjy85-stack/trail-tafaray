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
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-[#1F2C3F] mb-4">Course introuvable</h1>
        <Link href="/courses" className="text-[#A1532D] underline">
          Retour aux courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <Link href="/courses" className="text-sm text-stone-500 hover:underline">
        ← Toutes les courses
      </Link>
      <h1 className="text-4xl font-bold text-[#1F2C3F] mt-4 mb-2">{c.nom}</h1>
      <p className="text-[#A1532D] font-medium mb-6">
        {c.distance}
        {c.denivele ? ` · D+ ${c.denivele}` : ""}
        {c.type_epreuve ? ` · ${c.type_epreuve}` : ""}
      </p>

      {c.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.image_url} alt={c.nom} className="w-full max-h-80 object-cover rounded-2xl mb-8" />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-stone-500">Tarif</div>
          <div className="font-bold">{Number(c.tarif || 0).toLocaleString("fr-MG")} Ar</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-stone-500">Départ</div>
          <div className="font-bold">{c.heure_depart || "—"}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-stone-500">Niveau</div>
          <div className="font-bold">{c.niveau || "—"}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-stone-500">T-shirt</div>
          <div className="font-bold">{c.tee_shirt ? "Oui" : "Non"}</div>
        </div>
      </div>

      {c.description && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#1F2C3F] mb-2">Description</h2>
          <p className="text-stone-700 whitespace-pre-line">{c.description}</p>
        </section>
      )}
      {c.historique && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#1F2C3F] mb-2">Historique</h2>
          <p className="text-stone-700 whitespace-pre-line">{c.historique}</p>
        </section>
      )}
      {c.particularites && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#1F2C3F] mb-2">Particularités</h2>
          <p className="text-stone-700 whitespace-pre-line">{c.particularites}</p>
        </section>
      )}
      {c.conditions && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#1F2C3F] mb-2">Conditions</h2>
          <p className="text-stone-700 whitespace-pre-line">{c.conditions}</p>
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {c.carte_url && (
          <div>
            <h3 className="font-medium mb-2">Carte</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.carte_url} alt="Carte" className="rounded-xl border" />
          </div>
        )}
        {c.profil_url && (
          <div>
            <h3 className="font-medium mb-2">Profil altimétrique</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.profil_url} alt="Profil" className="rounded-xl border" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {c.gpx_url && (
          <a href={c.gpx_url} className="border border-stone-300 px-5 py-2 rounded-full text-sm font-medium" download>
            Télécharger le GPX
          </a>
        )}
        {settings.inscriptions_ouvertes && (
          <Link
            href={`/inscription?course=${encodeURIComponent(c.nom)}`}
            className="bg-[#A1532D] text-white px-5 py-2 rounded-full text-sm font-medium"
          >
            S&apos;inscrire
          </Link>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const FALLBACK = [
  { nom: "Zaza Tafaray", slug: "zaza-tafaray", distance: "5 KM", type_epreuve: "RUN", tarif: 15000 },
  { nom: "Trail Découverte", slug: "trail-decouverte", distance: "12 KM", type_epreuve: "RUN", tarif: 25000 },
  { nom: "Trail Endurance", slug: "trail-endurance", distance: "25 KM", type_epreuve: "RUN", tarif: 35000 },
  { nom: "Trail Intense", slug: "trail-intense", distance: "35 KM", type_epreuve: "RUN", tarif: 45000 },
  { nom: "VTT BEKA", slug: "vtt-beka", distance: "31 KM", type_epreuve: "BIKE", tarif: 40000 },
  { nom: "Duathlon Nature", slug: "duathlon-nature", distance: "24 KM", type_epreuve: "RUN · BIKE", tarif: 50000 },
];

export default async function CoursesPage() {
  const settings = await getSettings();
  let courses: any[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("courses").select("*").eq("active", true).order("ordre");
    courses = data && data.length ? data : FALLBACK;
  } catch {
    courses = FALLBACK;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="mb-12 sm:mb-14">
        <p className="section-kicker mb-3">Épreuves</p>
        <h1 className="text-4xl sm:text-5xl font-semibold text-[#0f1b2d] mb-4 tracking-tight">Les courses</h1>
        <p className="text-stone-600 max-w-2xl leading-relaxed">
          {settings.texte_courses ||
            "Choisissez votre format. Chaque course a ses catégories, distances et conditions spécifiques."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.nom}
            className="premium-card rounded-3xl p-7 hover:-translate-y-1 transition-all duration-300 flex flex-col"
          >
            <div className="inline-flex self-start text-xs font-semibold text-[#b7793d] tracking-[0.16em] uppercase mb-3">
              {course.type_epreuve || "RUN"}
            </div>
            <h2 className="text-2xl font-semibold text-[#0f1b2d] mb-2 tracking-tight">{course.nom}</h2>
            <p className="text-3xl font-bold text-[#0f1b2d] mb-2">{course.distance}</p>
            {course.denivele && (
              <p className="text-sm text-stone-500 mb-1">D+ {course.denivele}</p>
            )}
            <p className="text-base font-semibold text-[#b7793d] mb-6">
              {Number(course.tarif || 0).toLocaleString("fr-MG")} Ar
            </p>
            <div className="mt-auto flex flex-wrap gap-3">
              <Link
                href={`/courses/${course.slug || "detail"}`}
                className="inline-flex border border-stone-300/80 px-4 py-2.5 rounded-full text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
              >
                Détails
              </Link>
              {settings.inscriptions_ouvertes && (
                <Link
                  href={`/inscription?course=${encodeURIComponent(course.nom)}`}
                  className="inline-flex bg-[#0f1b2d] text-white px-4 py-2.5 rounded-full text-sm font-medium hover:bg-[#18263b] transition"
                >
                  S&apos;inscrire
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

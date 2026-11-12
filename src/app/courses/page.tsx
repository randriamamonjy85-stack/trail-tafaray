import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const FALLBACK = [
  { nom: "Zaza Tafaray", slug: "zaza-tafaray", distance: "5 KM", type_epreuve: "RUN", tarif: 15000, image_url: "" },
  { nom: "Trail Découverte", slug: "trail-decouverte", distance: "12 KM", type_epreuve: "RUN", tarif: 25000, image_url: "" },
  { nom: "Trail Endurance", slug: "trail-endurance", distance: "25 KM", type_epreuve: "RUN", tarif: 35000, image_url: "" },
  { nom: "Trail Intense", slug: "trail-intense", distance: "35 KM", type_epreuve: "RUN", tarif: 45000, image_url: "" },
  { nom: "VTT BEKA", slug: "vtt-beka", distance: "31 KM", type_epreuve: "BIKE", tarif: 40000, image_url: "" },
  { nom: "Duathlon Nature", slug: "duathlon-nature", distance: "24 KM", type_epreuve: "RUN · BIKE", tarif: 50000, image_url: "" },
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
          <Link
            key={course.nom}
            href={`/courses/${course.slug || "detail"}`}
            className="group relative rounded-3xl overflow-hidden min-h-[320px] flex flex-col justify-end p-7 shadow-lg shadow-black/10 hover:-translate-y-1.5 transition-all duration-300 ring-1 ring-black/5"
          >
            {course.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.image_url}
                alt={course.nom}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#0f1b2d] via-[#18263b] to-[#243955]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1b2d]/90 via-[#0f1b2d]/40 to-[#0f1b2d]/10" />
            <div className="relative z-10">
              <div className="inline-flex text-xs font-semibold text-[#d9a441] tracking-[0.16em] uppercase mb-3 bg-black/20 backdrop-blur px-3 py-1 rounded-full">
                {course.type_epreuve || "RUN"}
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-1 tracking-tight">{course.nom}</h2>
              <p className="text-2xl font-bold text-white mb-1">{course.distance}</p>
              {course.denivele && <p className="text-sm text-stone-300 mb-2">D+ {course.denivele}</p>}
              <p className="text-base font-semibold text-[#f0c96b] mb-5">
                {Number(course.tarif || 0).toLocaleString("fr-MG")} Ar
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex border border-white/30 bg-white/10 backdrop-blur px-4 py-2.5 rounded-full text-sm font-medium text-white">
                  Détails
                </span>
                {settings.inscriptions_ouvertes && (
                  <span className="inline-flex bg-gradient-to-r from-[#b7793d] to-[#d9a441] text-[#0f1b2d] px-4 py-2.5 rounded-full text-sm font-semibold">
                    S&apos;inscrire
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

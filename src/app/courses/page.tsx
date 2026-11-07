import Link from "next/link";
import { getSettings, getTarifs } from "@/lib/settings";

export const dynamic = "force-dynamic";

const coursesMeta = [
  { name: "Zaza Tafaray", distance: "5 KM", type: "RUN", age: "Enfants" },
  { name: "Trail Découverte", distance: "12 KM", type: "RUN", age: "Tous niveaux" },
  { name: "Trail Endurance", distance: "25 KM", type: "RUN", age: "Adultes" },
  { name: "Trail Intense", distance: "35 KM", type: "RUN", age: "Adultes confirmés" },
  { name: "VTT BEKA", distance: "31 KM", type: "BIKE", age: "Adultes" },
  { name: "Duathlon Nature", distance: "24 KM", type: "RUN · BIKE", age: "Adultes" },
];

export default async function CoursesPage() {
  const settings = await getSettings();
  const tarifs = getTarifs(settings);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-[#1F2C3F] mb-4">Les courses</h1>
      <p className="text-stone-600 mb-12 max-w-2xl">
        {settings.texte_courses ||
          "Choisissez votre format. Chaque course a ses catégories, distances et conditions spécifiques."}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesMeta.map((course) => (
          <div
            key={course.name}
            className="bg-white rounded-2xl p-6 border border-stone-200 hover:shadow-md transition"
          >
            <div className="text-sm font-medium text-[#A1532D] mb-2">{course.type}</div>
            <h2 className="text-xl font-bold text-[#1F2C3F] mb-2">{course.name}</h2>
            <p className="text-3xl font-bold text-stone-800 mb-3">{course.distance}</p>
            <p className="text-sm text-stone-600 mb-1">Public : {course.age}</p>
            <p className="text-sm font-medium text-[#A1532D] mb-4">
              {(tarifs[course.name] || 0).toLocaleString("fr-MG")} Ar
            </p>
            <div className="flex flex-wrap gap-3">
              {settings.inscriptions_ouvertes ? (
                <Link
                  href={`/inscription?course=${encodeURIComponent(course.name)}`}
                  className="inline-block bg-[#A1532D] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#8a4526]"
                >
                  S&apos;inscrire
                </Link>
              ) : (
                <span className="text-sm text-stone-500">Inscriptions fermées</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

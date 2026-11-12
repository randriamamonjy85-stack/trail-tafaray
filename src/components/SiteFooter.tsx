import { getSettings } from "@/lib/settings";

export default async function SiteFooter() {
  const s = await getSettings();
  const anyS = s as any;

  return (
    <footer className="relative overflow-hidden bg-[#0f1b2d] text-stone-300 pt-16 pb-10">
      <div className="absolute inset-0 bg-[radial-gradient(700px_300px_at_80%_0%,rgba(183,121,61,0.18),transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <h3 className="text-white font-semibold text-lg mb-4 tracking-tight">Trail Tafaray</h3>
            <p className="text-sm leading-relaxed text-stone-400">
              {anyS.footer_texte ||
                "Association organisatrice d'événements trail et VTT à Anjeva, Madagascar."}
            </p>
          </div>
          <div>
            <h4 className="text-white/95 font-medium mb-4">Navigation</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="/evenements" className="hover:text-[#d9a441] transition">Événements</a></li>
              <li><a href="/courses" className="hover:text-[#d9a441] transition">Courses</a></li>
              <li><a href="/inscription" className="hover:text-[#d9a441] transition">Inscription</a></li>
              <li><a href="/galerie" className="hover:text-[#d9a441] transition">Galerie</a></li>
              <li><a href="/documents" className="hover:text-[#d9a441] transition">Documents</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white/95 font-medium mb-4">Légal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="/mentions-legales" className="hover:text-[#d9a441] transition">Mentions légales</a></li>
              <li><a href="/confidentialite" className="hover:text-[#d9a441] transition">Confidentialité</a></li>
              <li><a href="/reglement" className="hover:text-[#d9a441] transition">Règlement</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white/95 font-medium mb-4">Contact</h4>
            <p className="text-sm text-stone-400">{anyS.footer_adresse || "Anjeva, Madagascar"}</p>
            {anyS.footer_email && (
              <p className="text-sm mt-3">
                <a href={`mailto:${anyS.footer_email}`} className="hover:text-[#d9a441] transition">
                  {anyS.footer_email}
                </a>
              </p>
            )}
            {anyS.footer_tel && <p className="text-sm mt-1 text-stone-400">{anyS.footer_tel}</p>}
            <div className="flex flex-wrap gap-3 mt-4 text-sm">
              {anyS.facebook_url && (
                <a href={anyS.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#d9a441] transition">
                  Facebook
                </a>
              )}
              {anyS.instagram_url && (
                <a href={anyS.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#d9a441] transition">
                  Instagram
                </a>
              )}
              {anyS.youtube_url && (
                <a href={anyS.youtube_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#d9a441] transition">
                  YouTube
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-stone-500">
          <span>© {new Date().getFullYear()} Association Trail Tafaray. Tous droits réservés.</span>
          <span className="text-stone-600">RUN · BIKE · ANJEVA</span>
        </div>
      </div>
    </footer>
  );
}

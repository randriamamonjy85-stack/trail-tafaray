import { getSettings } from "@/lib/settings";

export default async function SiteFooter() {
  const s = await getSettings();
  const anyS = s as any;

  return (
    <footer className="bg-[#1F2C3F] text-stone-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-4">Trail Tafaray</h3>
            <p className="text-sm">
              {anyS.footer_texte ||
                "Association organisatrice d'événements trail et VTT à Anjeva, Madagascar."}
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/evenements" className="hover:text-white">
                  Événements
                </a>
              </li>
              <li>
                <a href="/courses" className="hover:text-white">
                  Courses
                </a>
              </li>
              <li>
                <a href="/inscription" className="hover:text-white">
                  Inscription
                </a>
              </li>
              <li>
                <a href="/galerie" className="hover:text-white">
                  Galerie
                </a>
              </li>
              <li>
                <a href="/documents" className="hover:text-white">
                  Documents
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/mentions-legales" className="hover:text-white">
                  Mentions légales
                </a>
              </li>
              <li>
                <a href="/confidentialite" className="hover:text-white">
                  Confidentialité
                </a>
              </li>
              <li>
                <a href="/reglement" className="hover:text-white">
                  Règlement
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Contact</h4>
            {anyS.footer_adresse && <p className="text-sm">{anyS.footer_adresse}</p>}
            {!anyS.footer_adresse && <p className="text-sm">Anjeva, Madagascar</p>}
            {anyS.footer_email && (
              <p className="text-sm mt-2">
                <a href={`mailto:${anyS.footer_email}`} className="hover:text-white">
                  {anyS.footer_email}
                </a>
              </p>
            )}
            {anyS.footer_tel && <p className="text-sm mt-1">{anyS.footer_tel}</p>}
            <div className="flex gap-3 mt-3 text-sm">
              {anyS.facebook_url && (
                <a href={anyS.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  Facebook
                </a>
              )}
              {anyS.instagram_url && (
                <a href={anyS.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  Instagram
                </a>
              )}
              {anyS.youtube_url && (
                <a href={anyS.youtube_url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  YouTube
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-stone-700 text-center text-sm">
          © {new Date().getFullYear()} Association Trail Tafaray. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}

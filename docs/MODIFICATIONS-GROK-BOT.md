# Modifications du 10/11/2026

Auteur : Grok Bot (assistant de Hoby)

Ce document est pour l'assistant qui reprend le projet. Il décrit uniquement le travail sur les certificats finisher après la fusion de la PR #1 (commit `487c839`).

## Pourquoi

Le PDF du site doit être le même que celui préparé dans TMH : même fond, mêmes polices, mêmes positions. Les polices du paquet ZIP n'étaient pas vraiment intégrées (pdf-lib a besoin de `@pdf-lib/fontkit`). La graisse et l'espacement des lettres étaient lus dans le JSON puis ignorés. Il fallait aussi fermer quelques trous : admin ouvert à tout le monde si la liste d'e-mails est vide, ancienne saisie manuelle des résultats, liste publique des coureurs, fichiers du certificat dans le bucket public `photos`.

## Fichiers modifiés, et pourquoi

Polices et PDF

- `src/lib/certificats/pdf.ts` — enregistre fontkit, intègre les polices TTF/OTF (sous-ensemble), choisit le fichier gras ou normal, applique `letterSpacing` (en points) et réduit la taille si le texte dépasse `maxWidth_mm`. Aucune police de remplacement (pas d'Helvetica).
- `src/lib/certificats/validate-settings.ts` — validation stricte du JSON : seulement les champs Nom complet, Course, Temps, Classement, Édition ; nombres et bornes en millimètres sur la page ; clés inconnues refusées. Décalages dx/dy limités à 40 mm.
- `src/lib/certificats/tmh-package.ts` — le ZIP est refusé si une police demandée n'est pas dans le paquet. Le gras doit avoir son fichier.
- `src/lib/certificats/load-assets.ts` et `src/lib/certificats/storage.ts` — lecture serveur dans le bucket privé `certificats-prives`.
- `src/lib/certificats/fixtures/Lato-Regular.ttf`, `Lato-Bold.ttf`, `OFL.txt` — police libre (licence OFL) utilisée seulement par les tests.
- `samples/certificats/reglages-exemple-v1.json` — l'exemple cite maintenant le fichier Regular et le fichier Bold.
- `package.json`, `package-lock.json` — dépendance `@pdf-lib/fontkit`.
- `next.config.ts` — fontkit laissé en paquet serveur (non bundlé).

Admin et sécurité

- `src/lib/admin-allowlist.ts` et `src/lib/supabase/require-admin.ts` — si `ADMIN_EMAILS` (ou `ADMIN_EMAIL`) est vide, personne n'est admin.
- `src/app/api/admin/me/route.ts` et `src/app/admin/page.tsx` — l'écran admin appelle cette route. Onglet Certificats ajouté au type `Tab`. L'import JSON des anciens résultats est retiré de l'écran.
- `src/app/api/results/route.ts` et `src/app/api/results/results-route.ts` — `POST /api/results` répond 410. La lecture publique de l'ancienne table `resultats` ne change pas.
- `src/app/api/admin/certificats/route.ts` et `src/components/admin/CertificatsAdmin.tsx` — comparaison côte à côte (aperçu du site / PDF TMH) avec le coureur fictif Aina RABE, case à cocher obligatoire avant confirmation, décalages de secours.
- `src/app/api/certificat/lookup/route.ts` et `src/app/api/certificat/pdf/route.ts` — limite d'essais via Supabase (repli mémoire si la migration n'est pas encore passée).
- `src/app/api/certificat/results/route.ts` — ne renvoie plus la liste des coureurs.
- `src/lib/rate-limit-shared.ts` — compteur partagé entre les instances Vercel. La clé stockée est un hash, pas l'adresse IP en clair.
- `src/lib/certificats/parse-results.ts` — petit nettoyage (fonction inutilisée). Le format des 13 colonnes n'a pas changé.
- `GUIDE_CERTIFICATS_HOBY.md` — le guide de Hoby suit le nouveau parcours (comparaison, bucket privé).

Retirés (fichiers ajoutés par erreur, non utilisés)

- `src/app/inscription/page .txt`
- `src/app/inscription/proto.tsx`

La page d'inscription réelle `src/app/inscription/page.tsx` n'a pas été modifiée.

Tests ajoutés

- `src/lib/certificats/__tests__/pdf-fonts.test.ts`
- `src/lib/certificats/__tests__/validate-settings.test.ts`
- `src/lib/__tests__/admin-allowlist.test.ts`
- `src/lib/__tests__/rate-limit-shared.test.ts`

## Migrations SQL à exécuter à la main

Ne pas les lancer depuis l'application. Les coller dans Supabase → SQL Editor, dans cet ordre.

1. Si ce n'est pas déjà fait : `supabase/migrate_certificats.sql` (tables des éditions et des résultats).
2. Ensuite : `supabase/migrate_certificats_securite.sql`
   - colonne `template_offsets` ;
   - table `public_rate_limits` et fonction `consume_public_rate_limit` (service_role seulement) ;
   - bucket privé `certificats-prives` (public = false, aucune policy de lecture).

Après la migration 2, réimporter le paquet ZIP TMH dans l'admin. Les anciens fichiers qui auraient été mis dans le bucket public `photos` ne sont plus lus. Les supprimer à la main dans Storage s'ils existent (dossier `certificats/`).

Les autres migrations déjà présentes (`schema.sql`, `migrate_courses.sql`, etc.) ne font pas partie de ce changement. Ne les rejouer que si la base est neuve, et dans l'ordre déjà documenté du projet, avant les deux fichiers certificats.

## Variables Vercel

Déjà nécessaires :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (secrète, serveur seulement)

À vérifier avant de déployer cette branche :

- `ADMIN_EMAILS` — adresses séparées par des virgules, par exemple l'adresse de Hoby. `ADMIN_EMAIL` est accepté en secours s'il n'y a qu'une adresse.
- Si cette variable est vide, l'admin entier est fermé (écran et API), y compris la validation des inscriptions. Ce n'est pas un oubli : c'est pour ne plus traiter chaque compte connecté comme admin.

Aucun nouveau service payant. Pas de clé à ajouter pour les polices ou la limite d'essais.

## Ce qui reste à faire

- Exécuter la migration SQL ci-dessus, puis réimporter le ZIP TMH.
- Régler `ADMIN_EMAILS` sur Vercel avant le déploiement.
- Comparer visuellement le PDF du site et le PDF TMH avec le vrai fond. `y_mm` est la ligne de base du texte, mesurée depuis le haut de la page. Si un champ est décalé de quelques millimètres, utiliser dx/dy dans l'admin, recomparer, puis confirmer.
- Le gras n'existe que si le fichier Bold est dans le ZIP et dans la liste `fonts` du JSON.
- Une partie de l'admin (textes, photos, partenaires) écrit encore dans Supabase depuis le navigateur, avec les règles « utilisateur connecté ». L'écran est maintenant fermé si l'e-mail n'est pas dans la liste, mais les règles Supabase elles-mêmes n'ont pas été durcies ici, pour ne pas casser l'admin actuel. À faire plus tard, avec un essai sur une copie de la base.
- Tant que la migration des compteurs n'est pas exécutée, la limite d'essais retombe sur la mémoire d'une seule instance (moins solide si Vercel lance plusieurs serveurs).

## Règles à respecter

- Le CSV des inscriptions validées reste à 20 colonnes, dans le même ordre. Ne pas y toucher.
- Le CSV / XLSX des certificats reste à 13 colonnes : Édition, Course, Dossard, Prénom, Nom, Genre, Catégorie, Nationalité, Statut, Temps, Classement scratch, Classement genre, Classement catégorie. Pas d'e-mail, téléphone, adresse, date de naissance ou pièce d'identité.
- Le modèle graphique se prépare dans TMH, pas sur le site. Le site importe le ZIP et remplit les textes.
- Le site ne calcule aucun temps. La source officielle est TMH / GmCAP.
- Le fond, les polices et le PDF de référence restent dans le bucket privé. Pas de bucket public pour ces fichiers.
- Pas de liste publique des coureurs. Chacun retrouve son certificat avec édition + dossard + nom.
- Ne pas montrer de secret, de clé `service_role`, ni de donnée réelle de coureur dans les exemples, les tests ou les captures.

# Guide certificats finisher — pour Hoby

## Principe

Le site **n’édite pas** le certificat et **ne calcule aucun temps**.  
TMH (V1 ou V2) + GmCAP produisent les classements. Le site **importe** le fichier et **remplit** le modèle exporté par TMH.

## 1. Préparer le fichier résultats (reprise V1)

1. Exportez les classements depuis TMH V1 (Excel).
2. Créez un fichier avec **exactement** ces colonnes (ordre fixe) :

`Édition;Course;Dossard;Prénom;Nom;Genre;Catégorie;Nationalité;Statut;Temps;Classement scratch;Classement genre;Classement catégorie`

3. Statuts autorisés : `FINISHER`, `DNF`, `DNS`, `DSQ`, `HORS_DELAI`.
4. Temps au format `hh:mm:ss`. Pour non-finishers, classements vides.
5. **N’ajoutez jamais** email, téléphone, adresse, date de naissance, CIN, contact d’urgence.
6. Enregistrez en **CSV UTF-8** (séparateur `;`) ou **xlsx**.

Exemple fictif fourni : `samples/certificats/exemple-resultats-2026.csv`.

## 2. Importer dans l’admin

1. Admin → **Certificats**.
2. Créer l’édition (ex. `2026`).
3. Choisir le fichier → **Aperçu** (lignes, finishers, erreurs, doublons).
4. Si OK → **Confirmer l’import** (remplace l’édition, version précédente conservée pour rollback).

## 3. Modèle de certificat (TMH)

1. Créez le visuel dans TMH (pas sur le site).
2. Exportez depuis TMH :
   - image de fond JPG/PNG ;
   - **paquet ZIP** : fond HD, `reglages.json`, polices TTF/OTF, PDF d’exemple.
3. Dans Admin → Certificats : uploader le paquet ZIP (le fond seul seulement si besoin).
4. **Comparer** côte à côte l'aperçu du site (coureur fictif Aina RABE) et le PDF de référence TMH.
5. Si un texte est un peu décalé : régler dx / dy en millimètres, puis relancer la comparaison.
6. Cocher la confirmation, puis **Confirmer le modèle** (obligatoire avant publication).

Le gras utilise le fichier Bold fourni dans le ZIP. S'il manque, le modèle est refusé.
`letterSpacing` est un espacement en points. Au-delà de `maxWidth_mm`, la taille du texte diminue.

Fichier de réglages d’exemple (V1) : `samples/certificats/reglages-exemple-v1.json`  
À ajuster une fois avec le vrai fond V1 (positions en mm).

## 4. Publier

1. **Publier** l’édition (impossible sans modèle confirmé).
2. Il n’y a pas de liste publique des coureurs. Chacun trouve son certificat avec édition + dossard + nom.
3. **Masquer** pour retirer l’accès public.

## 5. Test public

1. Ouvrir `/certificat`.
2. Édition `2026`, dossard `101`, nom `Rabe` (après import de l’exemple).
3. Vérifier → télécharger le PDF.

## Sécurité

- Pas de liste publique des coureurs.
- Recherche : édition + dossard + nom (ensemble).
- Limite d’essais partagée (migration `supabase/migrate_certificats_securite.sql`).
- Fond, polices et PDF de référence : bucket privé `certificats-prives` (pas le bucket photos).
- Tables Supabase : pas de lecture publique. Migrations à exécuter à la main, dans l’ordre :
  1. `supabase/migrate_certificats.sql`
  2. `supabase/migrate_certificats_securite.sql`
- Variable Vercel obligatoire : `ADMIN_EMAILS` (liste d’e-mails). Si elle est vide, personne n’entre dans l’admin.

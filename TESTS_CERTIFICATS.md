# Tests réellement lancés (certificats)

Date de branche : feature/certificats-finisher

## Automatiques (vitest)

Commande : `npx vitest run src/lib/certificats`

1. `parse-results.test.ts` — CSV valide (total, finishers, nom_norm)
2. `parse-results.test.ts` — refus colonne Email interdite
3. `parse-results.test.ts` — doublons dossard même course
4. `parse-results.test.ts` — présence des champs dans EXAMPLE_SETTINGS_V1
5. `pdf-fonts.test.ts` — refus de génération PDF sans polices du paquet (pas de substitution)

## Non lancés dans cet environnement

- Import admin bout-en-bout (nécessite session admin + Supabase)
- Téléchargement public PDF (nécessite édition publiée + storage)
- Comparaison visuelle PDF site vs PDF référence TMH
- `npm run build` complet Next (dépendances réseau)

## Manuel recommandé après merge + migration SQL

1. Créer édition 2026
2. Importer `samples/certificats/exemple-resultats-2026.csv` (aperçu puis confirmer)
3. Uploader fond + paquet TMH de test
4. Aperçu PDF fictif → confirmer modèle → publier
5. `/certificat` avec dossard 101 / nom Rabe

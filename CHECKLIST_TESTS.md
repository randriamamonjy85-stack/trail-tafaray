# Checklist de tests — Trail Tafaray

Cochez après chaque test. Environnement : local (`localhost:3000`) puis production Vercel.

## Formulaire d’inscription

- [ ] Page une seule étape (pas de « Suivant »)
- [ ] Ordre des champs : **Nom** puis **Prénom**
- [ ] Date clavier `15061995` → `15/06/1995`
- [ ] Date via icône calendrier
- [ ] Date future refusée
- [ ] Email vide accepté
- [ ] Email invalide refusé
- [ ] Catégorie calculée automatiquement (âge min/max)
- [ ] Hors grille → **Hors catégorie (HC)**
- [ ] Pas de champ catégorie manuel
- [ ] Zaza Tafaray : pas de taille t-shirt
- [ ] Autres courses : tailles sans XS
- [ ] Navette Oui → + tarif navette × places
- [ ] Total (course + navette + frais) cohérent
- [ ] Course présélectionnée via `/inscription?course=Trail%20Endurance`
- [ ] Statut enregistré = **En attente**

## Admin inscriptions

- [ ] Liste visible uniquement si connecté
- [ ] Valider / Refuser
- [ ] **Supprimer** avec confirmation
- [ ] Export TMH : 20 colonnes, séparateur `;`
- [ ] Pas de référence Mobile Money dans le CSV
- [ ] Seules les **Validé** exportées
- [ ] Journal audit mis à jour

## Courses

- [ ] Admin : ajouter / modifier / désactiver
- [ ] Upload **image_url** visible sur **accueil**
- [ ] Bouton **En savoir plus** sur accueil et `/courses`
- [ ] Fiche détail + GPX si renseigné
- [ ] S’inscrire depuis la fiche

## Catégories âge

- [ ] Ajouter / modifier / supprimer une règle
- [ ] Âge min / max pris en compte
- [ ] Date de référence modifiable

## Médias & partenaires

- [ ] Photo admin → visible `/galerie` et accueil
- [ ] Logo partenaire + lien site
- [ ] CTA Devenir partenaire (mailto)

## Contenu

- [ ] Image hero admin → fond page d’accueil
- [ ] Mentions / confidentialité / règlement éditables
- [ ] Documents téléchargeables
- [ ] Pied de page (email, réseaux)

## Sécurité rapide

- [ ] `/api/export` sans session → 401
- [ ] `/api/inscriptions` GET sans session → 401
- [ ] Suppression sans session → 401
- [ ] Montant modifié dans le navigateur **ignoré** (recalcul serveur)

## Mobile

- [ ] Formulaire lisible sur smartphone
- [ ] Menu et boutons utilisables au doigt

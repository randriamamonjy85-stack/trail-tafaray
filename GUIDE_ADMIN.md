# Guide administrateur — Trail Tafaray

Ce document indique **où modifier chaque élément** du site, sans toucher au code.

Connexion admin : `https://VOTRE-SITE.vercel.app/admin`  
(compte créé dans Supabase → Authentication → Users)

---

## 1. Inscriptions

| Action | Où |
|--------|-----|
| Voir la liste | Admin → **Inscriptions** |
| Filtrer statut / course | Menus en haut du tableau |
| Valider / Refuser | Boutons verts / rouges (statut En attente) |
| **Supprimer** un participant | Bouton **Supprimer** (confirmation) |
| Export TMH (validées) | Bouton **Export TMH (validées)** |
| Export nouvelles seulement | Bouton **Export nouvelles** |

- Nouvelle inscription = toujours **En attente**
- Seules les **Validé** partent dans le CSV TMH (20 colonnes, sans référence Mobile Money)
- La **catégorie** est calculée automatiquement (âge + course) ; hors grille → **Hors catégorie (HC)**

---

## 2. Courses

| Action | Où |
|--------|-----|
| Liste / ajouter / modifier | Admin → **Courses** |
| Tarif, distance, dénivelé, textes | Formulaire de modification |
| **Photo** affichée sur l’accueil | Champ **image_url** (upload) |
| Carte / profil / GPX | Champs dédiés + upload |
| Désactiver (sans supprimer l’historique) | Bouton Activer / Désactiver |
| Fiche publique | `/courses/slug` + bouton **En savoir plus** |

---

## 3. Catégories d’âge

| Action | Où |
|--------|-----|
| Gérer les grilles | Admin → **Catégories âge** |
| Âge min / âge max | Champs principaux de chaque ligne |
| Courses autorisées | Cases à cocher |
| Ajouter / supprimer | Boutons dédiés |
| Date de calcul de l’âge | **Date de référence** en haut de l’onglet |

Règle : si l’âge du participant ne correspond à aucune ligne active pour la course → **HC**.

---

## 4. Contenu page d’accueil

| Élément | Où |
|---------|-----|
| Titre / sous-titre | Admin → **Contenu** |
| **Image principale (hero)** | Contenu → IMAGE PRINCIPALE (URL ou upload) |
| Date / lieu événement | Contenu |
| Textes courses / événements | Contenu |
| Tarifs courses (si utilisés via settings) | Contenu / Mobile Money zone tarifs selon version |

---

## 5. Visibilité des modules

Admin → **Visibilité**

- Inscriptions ouvertes / fermées  
- Résultats visibles  
- Partenaires / actualités visibles  

---

## 6. Mobile Money & navette

Admin → **Mobile Money**

| Champ | Rôle |
|-------|------|
| Numéros MVola / Orange / Airtel | Affichés au participant |
| Bénéficiaire / titulaire / instructions | Texte affiché |
| **Tarif navette** | Ar par personne |
| Frais (fixe ou %) | Par opérateur |
| Tarifs courses | Selon champs présents |

Le **montant total** est recalculé côté serveur (pas de confiance au navigateur).

---

## 7. Partenaires

Admin → **Partenaires**

- Ajout nom, type, description, logo (upload), site web  
- Logo **cliquable** vers le site si URL renseignée  
- Types : sponsor officiel, principal, institutionnel, technique, média, logistique, autre  
- Section publique « Devenir partenaire » → mailto `trailtafaray@gmail.com`

---

## 8. Photos / Galerie

Admin → **Photos**

1. Upload ou URL  
2. Case **visible**  
3. Affichage : `/galerie` + extrait accueil  

**Si l’image ne s’affiche pas** : Supabase Storage → bucket `photos` **public** + policy SELECT publique.

---

## 9. Pages légales & règlement

Admin → **Contenu** (bas de page)

- Mentions légales → `/mentions-legales`  
- Confidentialité → `/confidentialite`  
- Règlement → `/reglement`  

---

## 10. Documents téléchargeables

Admin → **Documents** → page publique `/documents`  
(PDF règlement, guides, cartes, etc.)

---

## 11. Pied de page & réseaux

Admin → **Pied de page**

Texte, email, téléphone, adresse, Facebook, Instagram, YouTube.

---

## 12. Résultats

Admin → **Résultats** (import / gestion selon écran)  
Visibilité : onglet **Visibilité**.

---

## 13. Journal d’audit

Admin → **Journal audit**  
Trace : validations, refus, suppressions, exports TMH.

---

## Rappels sécurité

- Ne partagez jamais la clé **service_role**  
- Un seul compte admin fort (mot de passe long)  
- Activez la **MFA** dans Supabase Auth si possible  
- Les exports et suppressions exigent d’être **connecté** admin  

# Rapport de livraison — Trail Tafaray

## Fonctionnalités livrées

### Inscriptions
- Formulaire une page, sections claires
- Nom puis Prénom
- Date JJ/MM/AAAA (clavier + calendrier)
- Email facultatif
- Catégorie auto par **âge min/max** + **HC** hors grille
- Navette tarifée (admin), frais Mobile Money, total serveur
- T-shirt sans XS ; masqué pour Zaza
- Présélection course depuis l’accueil
- Admin : valider, refuser, **supprimer**, export TMH 20 colonnes

### Courses
- CRUD admin, image, GPX, fiches publiques
- Accueil : image course + En savoir plus + S’inscrire

### Contenu & médias
- Hero image admin
- Galerie, partenaires (accueil + CTA mailto)
- Pages légales / règlement éditables
- Documents téléchargeables
- Pied de page & réseaux

### Sécurité
- APIs admin protégées par session
- Montants / catégorie recalculés serveur
- Rate limit inscriptions
- Anti CSV injection
- En-têtes HTTP de base
- Journal d’audit

## Migrations SQL (ordre)

1. schema.sql (base initiale si besoin)
2. migrate_extra.sql
3. migrate_categories_and_security.sql
4. migrate_courses.sql
5. migrate_content.sql
6. migrate_phase5.sql
7. migrate_ages.sql

## Documents joints

- GUIDE_ADMIN.md — où modifier quoi
- CHECKLIST_TESTS.md — tests à cocher
- SAUVEGARDES.md — backup / restauration

## Points de vigilance restants

- Activer MFA admin dans Supabase
- Vérifier policies Storage en production
- Rate limit en mémoire : limité sur multi-instances Vercel (acceptable pour le volume actuel)
- CSP stricte non activée (éviter de casser uploads / images externes)
- Pas de paiement Mobile Money automatisé (validation manuelle volontaire)

## Objectif atteint

Le site reste sur Next.js + Supabase + Vercel.  
La quasi-totalité du contenu public et des paramètres métier est administrable sans recoder.

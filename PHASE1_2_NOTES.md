# Phase 1 + 2 — Sécurité & formulaire d'inscription

## Migration SQL à exécuter dans Supabase

SQL Editor → coller le contenu de :
`supabase/migrate_categories_and_security.sql`

Cela crée :
- table `category_rules` (années de naissance modifiables en admin plus tard)
- colonnes navette, frais MM, hero image, tailles tee, etc. sur `site_settings`
- seed initial d'après vos tableaux 2026 (trail + VTT + duathlon)

## Déjà livré

### Sécurité
- GET /api/inscriptions, action valider/refuser, export CSV, POST results : **session admin obligatoire**
- Montant recalculé **côté serveur** (tarif course + navette + frais)
- Catégorie calculée **côté serveur** (pas de confiance au client)
- Anti CSV injection
- En-têtes X-Content-Type-Options, X-Frame-Options, Referrer-Policy

### Formulaire
- Une seule page, 6 sections
- Date : saisie 15061995 → 15/06/1995 + calendrier
- Catégorie automatique (plus de champ manuel)
- Email facultatif
- Navette 20 000 Ar / place (réglable via `tarif_navette`)
- Récap total + frais MM
- Pas de taille XS ; t-shirt masqué pour Zaza Tafaray
- Présélection course via `/inscription?course=Trail%20Endurance`

## Prochaines phases
- Admin édition des category_rules
- Courses CRUD + fiches GPX
- Galerie photos publique
- Contenu légal / hero admin
- MFA / rate limit avancé

## TMH
CSV 20 colonnes inchangé ; catégorie auto dans la colonne 6.

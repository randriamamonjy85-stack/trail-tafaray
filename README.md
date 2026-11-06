# Trail Tafaray – Site officiel

Site Next.js + Supabase pour l'Association Trail Tafaray (inscriptions, admin, contenu dynamique).

## Prérequis
- Node.js 18+
- Compte Supabase (projet déjà créé)

## Installation
```bash
npm install
cp .env.local.example .env.local
# Remplir les 3 variables Supabase dans .env.local
```

## Base de données
1. SQL Editor Supabase → exécuter `supabase/schema.sql` (nouveau projet)
   OU `supabase/migrate_extra.sql` (si tables déjà créées)
2. Storage → créer un bucket public nommé `photos`
3. Authentication → Users → créer un utilisateur admin

## Lancer
```bash
npm run dev
```
- Site : http://localhost:3000
- Admin : http://localhost:3000/admin

## Production (Vercel)
1. Pousser sur GitHub
2. Importer sur Vercel
3. Ajouter les mêmes variables d'environnement
4. Déployer

## Admin
Connexion sécurisée via Supabase Auth.
Gestion : inscriptions, contenu, tarifs, visibilité modules, Mobile Money, partenaires, actualités, photos, résultats, export TMH.

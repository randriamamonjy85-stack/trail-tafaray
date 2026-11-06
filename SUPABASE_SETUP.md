# Trail Tafaray – Migration Supabase + Admin

## 1. Créer le projet Supabase
1. Allez sur https://supabase.com
2. Créez un compte (gratuit)
3. Nouveau projet → choisissez une région proche (ex. Frankfurt ou Singapore)
4. Notez :
   - Project URL
   - anon public key
   - service_role key (gardez-la secrète)

## 2. Créer les tables
Dans Supabase → SQL Editor → collez et exécutez le contenu de `supabase/schema.sql`.

## 3. Configurer le projet local
1. Copiez `.env.local.example` en `.env.local`
2. Remplissez les deux variables avec vos clés Supabase.

## 4. Déployer sur Vercel
1. Poussez le projet sur GitHub
2. Importez-le sur https://vercel.com
3. Ajoutez les mêmes variables d’environnement dans Vercel
4. Déployez

## 5. Admin
Une fois déployé :
- `/admin` → connexion
- Vous pourrez gérer inscriptions, contenu, visibilité des modules, partenaires, actualités, résultats et export TMH.

Le mot de passe admin temporaire sera remplacé par l’authentification Supabase.

# Sauvegardes & restauration — Trail Tafaray

## 1. Base de données Supabase

### Sauvegarde manuelle (recommandée chaque semaine en période d’inscriptions)

1. [Supabase Dashboard](https://supabase.com/dashboard) → votre projet  
2. **Settings** → **Database**  
3. Section **Database backups** (plan Free : backups limités ; Pro : backups journaliers)  
4. Ou **SQL Editor** → exporter les tables importantes :

```sql
-- Exemple : compter les inscriptions
select count(*), statut from inscriptions group by statut;
```

### Export CSV des inscriptions (copie de travail)

Admin → Inscriptions → **Export TMH** (validées)  
Ou dans Supabase : Table Editor → `inscriptions` → Export CSV

### Tables critiques à préserver

- `inscriptions`
- `site_settings`
- `category_rules`
- `courses`
- `partenaires`
- `photos`
- `documents`
- `resultats`
- `admin_audit_log`

## 2. Fichiers Storage (photos, GPX, PDF)

Bucket `photos` : dans Supabase → **Storage** → télécharger les dossiers importants  
(`courses/`, `docs/`, etc.)

## 3. Code source

- Dépôt GitHub : `randriamamonjy85-stack/trail-tafaray`
- Chaque `git push` versionne le code
- Conservez aussi les ZIP livrés (phases)

## 4. Variables d’environnement

Notez hors ligne (gestionnaire de mots de passe) :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (**secret**)

Ne jamais committer `.env.local` ni la service_role.

## 5. Restauration rapide

1. Recréer / ouvrir le projet Supabase  
2. Rejouer les scripts SQL dans l’ordre :
   - `schema.sql` (si base vide)
   - `migrate_extra.sql`
   - `migrate_categories_and_security.sql`
   - `migrate_courses.sql`
   - `migrate_content.sql`
   - `migrate_phase5.sql`
   - `migrate_ages.sql`
3. Réimporter les données CSV si besoin  
4. Recréer le bucket `photos` + policies public read / authenticated write  
5. Redéployer Vercel avec les 3 variables d’environnement  
6. Recréer l’utilisateur admin (Auth → Users)

## 6. Bonnes pratiques

- Avant une grosse modification admin : export CSV des inscriptions  
- Après chaque phase de développement : `git push`  
- Tester une restauration **une fois** hors période critique  
- Plan Supabase Pro si vous voulez des backups automatiques quotidiens

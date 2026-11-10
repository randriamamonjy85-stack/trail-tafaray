-- Corrections audit sécurité Trail Tafaray (à exécuter dans Supabase SQL Editor)

-- 1) Compteur de références (ne recule jamais)
create table if not exists reference_counters (
  course text primary key,
  last_seq integer not null default 0
);

-- Initialiser depuis les max existants
insert into reference_counters (course, last_seq)
select course,
  coalesce(max(nullif(regexp_replace(reference, '\D', '', 'g'), '')::int), 0)
from inscriptions
group by course
on conflict (course) do update
set last_seq = greatest(reference_counters.last_seq, excluded.last_seq);

-- 2) Colonne acceptation règlement
alter table inscriptions add column if not exists reglement_accepte_at timestamptz;

-- 3) RLS : interdire insert public avec statut libre
-- Supprimer anciennes policies trop ouvertes si elles existent
drop policy if exists "Public can insert inscriptions" on inscriptions;
drop policy if exists "inscriptions_insert_public" on inscriptions;
drop policy if exists "Enable insert for all users" on inscriptions;
drop policy if exists "public_insert_inscriptions" on inscriptions;

-- Ne plus autoriser d'insert anonyme direct : le site utilise service_role via /api/inscriptions
-- Si une policy insert publique est requise en secours, forcer En attente :
-- create policy inscriptions_insert_pending_only on inscriptions for insert to anon, authenticated
-- with check (statut = 'En attente');

-- Lecture publique interdite sur inscriptions
drop policy if exists "Public can read inscriptions" on inscriptions;
alter table inscriptions enable row level security;

-- Authenticated ne lit/écrit PAS inscriptions sans service role
-- (l'admin API utilise service_role)

-- 4) site_settings : lecture publique OK pour le site, écriture réservée service_role
alter table site_settings enable row level security;
drop policy if exists "Public read site_settings" on site_settings;
create policy "Public read site_settings" on site_settings for select using (true);

-- 5) courses : lecture des actives
alter table courses enable row level security;
drop policy if exists "Public read active courses" on courses;
create policy "Public read active courses" on courses for select using (active = true);

-- 6) category_rules lecture publique (calcul côté client + serveur)
alter table category_rules enable row level security;
drop policy if exists "Public read category_rules" on category_rules;
create policy "Public read category_rules" on category_rules for select using (true);

-- 7) partenaires / photos visibles
alter table partenaires enable row level security;
drop policy if exists "Public read partenaires" on partenaires;
create policy "Public read partenaires" on partenaires for select using (visible = true);

alter table photos enable row level security;
drop policy if exists "Public read photos" on photos;
create policy "Public read photos" on photos for select using (visible = true);

-- 8) resultats : lecture publique (visibilité gérée aussi par API)
alter table resultats enable row level security;
drop policy if exists "Public read resultats" on resultats;
create policy "Public read resultats" on resultats for select using (true);

-- NOTE: les écritures admin passent par SUPABASE_SERVICE_ROLE_KEY (bypass RLS).
-- Vérifier dans Authentication que "Enable sign ups" est désactivé.

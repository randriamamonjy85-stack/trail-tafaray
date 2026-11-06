-- Schéma Supabase pour Trail Tafaray
-- À exécuter dans l'éditeur SQL de Supabase

-- Table des inscriptions
create table if not exists inscriptions (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  prenom text not null,
  nom text not null,
  date_naissance text not null,
  genre text not null,
  categorie text,
  nationalite text,
  email text,
  telephone text,
  adresse text,
  organisation text,
  taille_tee text,
  navette text default 'Non',
  places_navette integer default 0,
  course text not null,
  contact_urgence text,
  telephone_urgence text,
  numero_identite text,
  statut text default 'En attente' check (statut in ('En attente', 'Validé', 'Refusé')),
  cree_le text,
  operateur text,
  reference_paiement text,
  montant_declare numeric,
  exporte boolean default false,
  date_export timestamptz,
  created_at timestamptz default now()
);

-- Table des paramètres du site
create table if not exists site_settings (
  id integer primary key default 1,
  inscriptions_ouvertes boolean default true,
  resultats_visibles boolean default false,
  partenaires_visibles boolean default true,
  actualites_visibles boolean default true,
  hero_titre text default 'Trail Tafaray',
  hero_sous_titre text default 'Une aventure qui relie les sentiers et les personnes au cœur des paysages d’Anjeva.',
  date_evenement text default '2027-10-24T06:00:00+03:00',
  lieu_evenement text default 'Anjeva, Madagascar',
  texte_evenements text default '',
  texte_courses text default '',
  texte_reglement text default '',
  tarif_zaza integer default 15000,
  tarif_decouverte integer default 25000,
  tarif_endurance integer default 35000,
  tarif_intense integer default 45000,
  tarif_vtt integer default 40000,
  tarif_duathlon integer default 50000,
  mobile_money_mvola text default '',
  mobile_money_orange text default '',
  mobile_money_airtel text default '',
  updated_at timestamptz default now()
);

create table if not exists partenaires (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  type text,
  description text,
  logo_url text,
  site_url text,
  visible boolean default true,
  ordre integer default 0,
  created_at timestamptz default now()
);

create table if not exists actualites (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  contenu text,
  image_url text,
  date_publication date default current_date,
  visible boolean default true,
  created_at timestamptz default now()
);

create table if not exists resultats (
  id uuid primary key default gen_random_uuid(),
  position integer,
  nom text,
  temps text,
  course text,
  categorie text,
  genre text,
  created_at timestamptz default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  titre text,
  url text not null,
  album text default 'general',
  visible boolean default true,
  ordre integer default 0,
  created_at timestamptz default now()
);

insert into site_settings (id) values (1) on conflict (id) do nothing;

alter table inscriptions enable row level security;
alter table site_settings enable row level security;
alter table partenaires enable row level security;
alter table actualites enable row level security;
alter table resultats enable row level security;
alter table photos enable row level security;

drop policy if exists "Lecture publique partenaires" on partenaires;
drop policy if exists "Lecture publique actualites" on actualites;
drop policy if exists "Lecture publique resultats" on resultats;
drop policy if exists "Lecture publique settings" on site_settings;
drop policy if exists "Lecture publique photos" on photos;
drop policy if exists "Insertion publique inscriptions" on inscriptions;
drop policy if exists "Admin tout inscriptions" on inscriptions;
drop policy if exists "Admin tout settings" on site_settings;
drop policy if exists "Admin tout partenaires" on partenaires;
drop policy if exists "Admin tout actualites" on actualites;
drop policy if exists "Admin tout resultats" on resultats;
drop policy if exists "Admin tout photos" on photos;

create policy "Lecture publique partenaires" on partenaires for select using (visible = true);
create policy "Lecture publique actualites" on actualites for select using (visible = true);
create policy "Lecture publique resultats" on resultats for select using (true);
create policy "Lecture publique settings" on site_settings for select using (true);
create policy "Lecture publique photos" on photos for select using (visible = true);
create policy "Insertion publique inscriptions" on inscriptions for insert with check (true);

create policy "Admin tout inscriptions" on inscriptions for all using (auth.role() = 'authenticated');
create policy "Admin tout settings" on site_settings for all using (auth.role() = 'authenticated');
create policy "Admin tout partenaires" on partenaires for all using (auth.role() = 'authenticated');
create policy "Admin tout actualites" on actualites for all using (auth.role() = 'authenticated');
create policy "Admin tout resultats" on resultats for all using (auth.role() = 'authenticated');
create policy "Admin tout photos" on photos for all using (auth.role() = 'authenticated');

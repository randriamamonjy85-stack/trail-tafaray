-- Table courses administrable
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  nom text unique not null,
  slug text unique,
  distance text default '',
  denivele text default '',
  type_epreuve text default 'RUN',
  tarif integer default 0,
  heure_depart text default '',
  niveau text default '',
  description text default '',
  historique text default '',
  particularites text default '',
  conditions text default '',
  image_url text default '',
  carte_url text default '',
  profil_url text default '',
  gpx_url text default '',
  tee_shirt boolean default true,
  active boolean default true,
  ordre integer default 0,
  inscriptions_from date,
  inscriptions_to date,
  created_at timestamptz default now()
);

alter table courses enable row level security;
drop policy if exists "Lecture publique courses" on courses;
drop policy if exists "Admin courses" on courses;
create policy "Lecture publique courses" on courses for select using (active = true);
create policy "Admin courses" on courses for all using (auth.role() = 'authenticated');

-- Seed si vide
insert into courses (nom, slug, distance, type_epreuve, tarif, tee_shirt, ordre, active)
select * from (values
  ('Zaza Tafaray', 'zaza-tafaray', '5 KM', 'RUN', 15000, false, 1, true),
  ('Trail Découverte', 'trail-decouverte', '12 KM', 'RUN', 25000, true, 2, true),
  ('Trail Endurance', 'trail-endurance', '25 KM', 'RUN', 35000, true, 3, true),
  ('Trail Intense', 'trail-intense', '35 KM', 'RUN', 45000, true, 4, true),
  ('VTT BEKA', 'vtt-beka', '31 KM', 'BIKE', 40000, true, 5, true),
  ('Duathlon Nature', 'duathlon-nature', '24 KM', 'RUN · BIKE', 50000, true, 6, true)
) as v(nom, slug, distance, type_epreuve, tarif, tee_shirt, ordre, active)
where not exists (select 1 from courses limit 1);

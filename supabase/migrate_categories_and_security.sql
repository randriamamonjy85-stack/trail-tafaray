-- Migration additive : règles de catégories administrables + paramètres navette / MM
-- Référence initiale : tableaux Trail Tafaray 2026 (modifiable dans l'admin)

create table if not exists category_rules (
  id uuid primary key default gen_random_uuid(),
  discipline text not null check (discipline in ('trail', 'vtt', 'duathlon')),
  code_base text not null,
  label_homme text not null,
  label_femme text not null,
  annee_naissance_min integer not null,
  annee_naissance_max integer not null,
  age_min integer,
  age_max integer,
  courses_autorisees text[] default '{}',
  ordre integer default 0,
  actif boolean default true,
  created_at timestamptz default now()
);

-- Paramètres supplémentaires (navette, année de référence catégories, etc.)
alter table site_settings add column if not exists annee_reference_categories integer default 2026;
alter table site_settings add column if not exists date_reference_categories text default '2026-10-25';
alter table site_settings add column if not exists tarif_navette integer default 20000;
alter table site_settings add column if not exists mm_beneficiaire text default 'Association Trail Tafaray';
alter table site_settings add column if not exists mm_titulaire text default '';
alter table site_settings add column if not exists mm_instructions text default 'Effectuez le transfert puis indiquez la référence de transaction.';
alter table site_settings add column if not exists mm_frais_mode text default 'fixe' check (mm_frais_mode in ('fixe', 'pourcent'));
alter table site_settings add column if not exists mm_frais_mvola numeric default 0;
alter table site_settings add column if not exists mm_frais_orange numeric default 0;
alter table site_settings add column if not exists mm_frais_airtel numeric default 0;
alter table site_settings add column if not exists hero_image_url text default '';
alter table site_settings add column if not exists tee_sizes text default 'S,M,L,XL,XXL';

-- Seed catégories TRAIL (si table vide)
insert into category_rules (discipline, code_base, label_homme, label_femme, annee_naissance_min, annee_naissance_max, age_min, age_max, courses_autorisees, ordre)
select * from (values
  ('trail', 'ZT', 'Zaza Tafaray Hommes (ZTH)', 'Zaza Tafaray Femmes (ZTF)', 2014, 2021, 5, 12, array['Zaza Tafaray'], 1),
  ('trail', 'CA', 'Cadets Hommes (CAH)', 'Cadets Femmes (CAF)', 2009, 2013, 13, 17, array['Zaza Tafaray','Trail Découverte'], 2),
  ('trail', 'JU', 'Juniors Hommes (JUH)', 'Juniors Femmes (JUF)', 2007, 2008, 18, 19, array['Zaza Tafaray','Trail Découverte','Trail Endurance'], 3),
  ('trail', 'ES', 'Espoirs Hommes (ESH)', 'Espoirs Femmes (ESF)', 2004, 2006, 20, 22, array['Zaza Tafaray','Trail Découverte','Trail Endurance','Trail Intense'], 4),
  ('trail', 'SE', 'Seniors Hommes (SEH)', 'Seniors Femmes (SEF)', 1994, 2003, 23, 32, array['Zaza Tafaray','Trail Découverte','Trail Endurance','Trail Intense'], 5),
  ('trail', 'M0', 'M0 Hommes (M0H)', 'M0 Femmes (M0F)', 1989, 1993, 33, 37, array['Zaza Tafaray','Trail Découverte','Trail Endurance','Trail Intense'], 6),
  ('trail', 'M1', 'Master 1 Hommes (M1H)', 'Master 1 Femmes (M1F)', 1984, 1988, 38, 42, array['Zaza Tafaray','Trail Découverte','Trail Endurance','Trail Intense'], 7),
  ('trail', 'M2', 'Master 2 Hommes (M2H)', 'Master 2 Femmes (M2F)', 1979, 1983, 43, 47, array['Zaza Tafaray','Trail Découverte','Trail Endurance','Trail Intense'], 8),
  ('trail', 'M3', 'Master 3 Hommes (M3H)', 'Master 3 Femmes (M3F)', 1974, 1978, 48, 52, array['Zaza Tafaray','Trail Découverte','Trail Endurance','Trail Intense'], 9),
  ('trail', 'M4', 'Master 4 Hommes (M4H)', 'Master 4 Femmes (M4F)', 1969, 1973, 53, 57, array['Zaza Tafaray','Trail Découverte','Trail Endurance','Trail Intense'], 10),
  ('trail', 'M5', 'Master 5 Hommes (M5H)', 'Master 5 Femmes (M5F)', 1900, 1968, 58, 120, array['Zaza Tafaray','Trail Découverte','Trail Endurance','Trail Intense'], 11)
) as v(discipline, code_base, label_homme, label_femme, annee_naissance_min, annee_naissance_max, age_min, age_max, courses_autorisees, ordre)
where not exists (select 1 from category_rules where discipline = 'trail' limit 1);

-- Seed VTT
insert into category_rules (discipline, code_base, label_homme, label_femme, annee_naissance_min, annee_naissance_max, age_min, age_max, courses_autorisees, ordre)
select * from (values
  ('vtt', 'ES', 'Espoirs Hommes', 'Espoirs Femmes', 2004, 2008, 18, 22, array['VTT BEKA'], 1),
  ('vtt', 'SE', 'Senior Hommes', 'Senior Femmes', 1987, 2003, 23, 39, array['VTT BEKA'], 2),
  ('vtt', 'V1', 'Master 1 (V1) Hommes', 'Master 1 (V1) Femmes', 1977, 1986, 40, 49, array['VTT BEKA'], 3),
  ('vtt', 'V2', 'Master 2 (V2) Hommes', 'Master 2 (V2) Femmes', 1967, 1976, 50, 59, array['VTT BEKA'], 4),
  ('vtt', 'V3', 'Master 3 (V3) Hommes', 'Master 3 (V3) Femmes', 1900, 1966, 60, 120, array['VTT BEKA'], 5)
) as v(discipline, code_base, label_homme, label_femme, annee_naissance_min, annee_naissance_max, age_min, age_max, courses_autorisees, ordre)
where not exists (select 1 from category_rules where discipline = 'vtt' limit 1);

-- Duathlon : mêmes règles trail (hors Zaza/Cadets selon courses)
insert into category_rules (discipline, code_base, label_homme, label_femme, annee_naissance_min, annee_naissance_max, age_min, age_max, courses_autorisees, ordre)
select * from (values
  ('duathlon', 'JU', 'Juniors Hommes (JUH)', 'Juniors Femmes (JUF)', 2007, 2008, 18, 19, array['Duathlon Nature'], 1),
  ('duathlon', 'ES', 'Espoirs Hommes (ESH)', 'Espoirs Femmes (ESF)', 2004, 2006, 20, 22, array['Duathlon Nature'], 2),
  ('duathlon', 'SE', 'Seniors Hommes (SEH)', 'Seniors Femmes (SEF)', 1994, 2003, 23, 32, array['Duathlon Nature'], 3),
  ('duathlon', 'M0', 'M0 Hommes (M0H)', 'M0 Femmes (M0F)', 1989, 1993, 33, 37, array['Duathlon Nature'], 4),
  ('duathlon', 'M1', 'Master 1 Hommes (M1H)', 'Master 1 Femmes (M1F)', 1984, 1988, 38, 42, array['Duathlon Nature'], 5),
  ('duathlon', 'M2', 'Master 2 Hommes (M2H)', 'Master 2 Femmes (M2F)', 1979, 1983, 43, 47, array['Duathlon Nature'], 6),
  ('duathlon', 'M3', 'Master 3 Hommes (M3H)', 'Master 3 Femmes (M3F)', 1974, 1978, 48, 52, array['Duathlon Nature'], 7),
  ('duathlon', 'M4', 'Master 4 Hommes (M4H)', 'Master 4 Femmes (M4F)', 1969, 1973, 53, 57, array['Duathlon Nature'], 8),
  ('duathlon', 'M5', 'Master 5 Hommes (M5H)', 'Master 5 Femmes (M5F)', 1900, 1968, 58, 120, array['Duathlon Nature'], 9)
) as v(discipline, code_base, label_homme, label_femme, annee_naissance_min, annee_naissance_max, age_min, age_max, courses_autorisees, ordre)
where not exists (select 1 from category_rules where discipline = 'duathlon' limit 1);

alter table category_rules enable row level security;
drop policy if exists "Lecture publique category_rules" on category_rules;
drop policy if exists "Admin category_rules" on category_rules;
create policy "Lecture publique category_rules" on category_rules for select using (actif = true);
create policy "Admin category_rules" on category_rules for all using (auth.role() = 'authenticated');

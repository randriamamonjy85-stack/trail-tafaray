-- À exécuter si vous aviez déjà créé les tables (ajoute les colonnes manquantes)

alter table site_settings add column if not exists texte_evenements text default '';
alter table site_settings add column if not exists texte_courses text default '';
alter table site_settings add column if not exists texte_reglement text default '';
alter table site_settings add column if not exists tarif_zaza integer default 15000;
alter table site_settings add column if not exists tarif_decouverte integer default 25000;
alter table site_settings add column if not exists tarif_endurance integer default 35000;
alter table site_settings add column if not exists tarif_intense integer default 45000;
alter table site_settings add column if not exists tarif_vtt integer default 40000;
alter table site_settings add column if not exists tarif_duathlon integer default 50000;

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  titre text,
  url text not null,
  album text default 'general',
  visible boolean default true,
  ordre integer default 0,
  created_at timestamptz default now()
);

alter table photos enable row level security;
drop policy if exists "Lecture publique photos" on photos;
drop policy if exists "Admin tout photos" on photos;
create policy "Lecture publique photos" on photos for select using (visible = true);
create policy "Admin tout photos" on photos for all using (auth.role() = 'authenticated');

insert into site_settings (id) values (1) on conflict (id) do nothing;

-- Politiques admin (au cas où)
drop policy if exists "Admin tout inscriptions" on inscriptions;
drop policy if exists "Admin tout settings" on site_settings;
drop policy if exists "Admin tout partenaires" on partenaires;
drop policy if exists "Admin tout actualites" on actualites;
drop policy if exists "Admin tout resultats" on resultats;
drop policy if exists "Insertion publique inscriptions" on inscriptions;

create policy "Insertion publique inscriptions" on inscriptions for insert with check (true);
create policy "Admin tout inscriptions" on inscriptions for all using (auth.role() = 'authenticated');
create policy "Admin tout settings" on site_settings for all using (auth.role() = 'authenticated');
create policy "Admin tout partenaires" on partenaires for all using (auth.role() = 'authenticated');
create policy "Admin tout actualites" on actualites for all using (auth.role() = 'authenticated');
create policy "Admin tout resultats" on resultats for all using (auth.role() = 'authenticated');

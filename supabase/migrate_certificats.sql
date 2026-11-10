-- Certificats finisher / résultats officiels TMH-GmCAP
-- À exécuter manuellement dans Supabase SQL Editor (non exécuté par cette PR).

create table if not exists certificate_editions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- ex. 2026
  label text not null,
  published boolean not null default false,
  results_version integer not null default 0,
  previous_snapshot jsonb,
  template_bg_path text,
  template_settings jsonb,
  template_fonts jsonb, -- [{name, path, family}]
  template_reference_pdf_path text,
  template_confirmed boolean not null default false,
  results_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists certificate_results (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references certificate_editions(id) on delete cascade,
  edition_code text not null,
  course text not null,
  dossard text not null,
  prenom text not null,
  nom text not null,
  nom_norm text not null, -- sans accents, minuscules
  genre text,
  categorie text,
  nationalite text,
  statut text not null check (statut in ('FINISHER','DNF','DNS','DSQ','HORS_DELAI')),
  temps text, -- hh:mm:ss
  classement_scratch text,
  classement_genre text,
  classement_categorie text,
  import_version integer not null default 1,
  created_at timestamptz not null default now(),
  unique (edition_id, course, dossard)
);

create index if not exists idx_cert_results_lookup
  on certificate_results (edition_id, dossard, nom_norm);

create index if not exists idx_cert_results_edition on certificate_results (edition_id);

alter table certificate_editions enable row level security;
alter table certificate_results enable row level security;

-- Pas de policy publique : accès uniquement via service_role (API serveur / admin).
-- Les politiques SELECT pour authenticated peuvent être ajoutées si besoin admin client ;
-- le site public n'interroge jamais ces tables depuis le navigateur.

comment on table certificate_results is 'Résultats officiels importés depuis TMH/GmCAP — pas de calcul de temps sur le site';

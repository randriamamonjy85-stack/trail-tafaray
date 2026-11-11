-- Publicité sponsors (non destructif — à exécuter manuellement par Hoby avant fusion)
-- Aucun DROP / DELETE de données existantes.

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  image_url text not null default '',
  site_url text,
  date_debut date,
  date_fin date,
  actif boolean not null default true,
  ordre integer not null default 0,
  afficher_popup boolean not null default false,
  afficher_bande boolean not null default true,
  vues integer not null default 0,
  clics integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sponsors_actif_ordre
  on public.sponsors (actif, ordre);

-- Lecture publique limitée aux sponsors actifs dans leurs dates
alter table public.sponsors enable row level security;

drop policy if exists "sponsors_public_select_actifs" on public.sponsors;
create policy "sponsors_public_select_actifs"
  on public.sponsors
  for select
  to anon, authenticated
  using (
    actif = true
    and (date_debut is null or date_debut <= (timezone('utc', now()))::date)
    and (date_fin is null or date_fin >= (timezone('utc', now()))::date)
  );

-- Pas d'écriture publique (insert/update/delete absents pour anon)
-- L'admin écrit via service_role (API serveur).

-- Compteurs : pas d'update direct public ; fonction limitée
create or replace function public.increment_sponsor_stat(p_id uuid, p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kind is null or p_id is null then
    return;
  end if;
  if p_kind = 'view' then
    update public.sponsors
    set vues = coalesce(vues, 0) + 1,
        updated_at = now()
    where id = p_id
      and actif = true
      and (date_debut is null or date_debut <= (timezone('utc', now()))::date)
      and (date_fin is null or date_fin >= (timezone('utc', now()))::date);
  elsif p_kind = 'click' then
    update public.sponsors
    set clics = coalesce(clics, 0) + 1,
        updated_at = now()
    where id = p_id
      and actif = true
      and (date_debut is null or date_debut <= (timezone('utc', now()))::date)
      and (date_fin is null or date_fin >= (timezone('utc', now()))::date);
  end if;
end;
$$;

revoke all on function public.increment_sponsor_stat(uuid, text) from public;
grant execute on function public.increment_sponsor_stat(uuid, text) to anon, authenticated;

comment on table public.sponsors is 'Sponsors publicitaires (pop-up + bande logos). Compteurs anonymes uniquement.';

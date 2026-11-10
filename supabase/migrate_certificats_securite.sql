-- Certificats : bucket privé + limite d'essais partagée + décalages de secours.
-- À exécuter À LA MAIN dans Supabase SQL Editor, APRÈS supabase/migrate_certificats.sql.
-- Ce fichier n'est pas exécuté par le site, ni par un déploiement.

-- 1) Décalages de secours (mm) enregistrés par l'admin.
alter table certificate_editions
  add column if not exists template_offsets jsonb not null default '{}'::jsonb;

comment on column certificate_editions.template_offsets is
  'Décalages dx_mm/dy_mm par champ. Pas de lecture publique.';

-- 2) Compteurs de tentatives (recherche de certificat). Accès service_role seulement.
create table if not exists public.public_rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket, window_start)
);

alter table public.public_rate_limits enable row level security;

revoke all on table public.public_rate_limits from public;
revoke all on table public.public_rate_limits from anon;
revoke all on table public.public_rate_limits from authenticated;
grant select, insert, update, delete on table public.public_rate_limits to service_role;

comment on table public.public_rate_limits is
  'Compteurs anti-abus. La clé est un hash, pas une adresse IP en clair. Pas de policy publique.';

create or replace function public.consume_public_rate_limit(
  p_bucket text,
  p_window_seconds integer,
  p_limit integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  w timestamptz;
  c integer;
begin
  if p_bucket is null or length(p_bucket) < 3 or length(p_bucket) > 200 then
    raise exception 'bucket invalide';
  end if;
  if p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'fenetre invalide';
  end if;
  if p_limit < 1 or p_limit > 1000 then
    raise exception 'limite invalide';
  end if;

  w := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.public_rate_limits (bucket, window_start, hits)
  values (p_bucket, w, 1)
  on conflict (bucket, window_start)
  do update set hits = public.public_rate_limits.hits + 1
  returning hits into c;

  if random() < 0.02 then
    delete from public.public_rate_limits
    where window_start < now() - interval '2 days';
  end if;

  return jsonb_build_object(
    'allowed', c <= p_limit,
    'remaining', greatest(p_limit - c, 0)
  );
end;
$$;

revoke all on function public.consume_public_rate_limit(text, integer, integer) from public;
revoke all on function public.consume_public_rate_limit(text, integer, integer) from anon;
revoke all on function public.consume_public_rate_limit(text, integer, integer) from authenticated;
grant execute on function public.consume_public_rate_limit(text, integer, integer) to service_role;

-- 3) Bucket privé : fond, polices, PDF de référence. Aucune policy de lecture publique.
insert into storage.buckets (id, name, public)
values ('certificats-prives', 'certificats-prives', false)
on conflict (id) do update set public = false;

comment on table certificate_editions is
  'Éditions de certificats. Fichiers dans le bucket privé certificats-prives, lus uniquement par le serveur.';

-- Documents téléchargeables
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text default '',
  url text not null,
  type_doc text default 'autre',
  visible boolean default true,
  ordre integer default 0,
  created_at timestamptz default now()
);

alter table documents enable row level security;
drop policy if exists "Lecture publique documents" on documents;
drop policy if exists "Admin documents" on documents;
create policy "Lecture publique documents" on documents for select using (visible = true);
create policy "Admin documents" on documents for all using (auth.role() = 'authenticated');

-- Journal d'audit admin
create table if not exists admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_email text,
  action text not null,
  objet text,
  detail text,
  created_at timestamptz default now()
);

alter table admin_audit_log enable row level security;
drop policy if exists "Admin audit read" on admin_audit_log;
drop policy if exists "Admin audit insert" on admin_audit_log;
create policy "Admin audit read" on admin_audit_log for select using (auth.role() = 'authenticated');
create policy "Admin audit insert" on admin_audit_log for insert with check (auth.role() = 'authenticated');

-- Footer / réseaux déjà en partie dans migrate_content ; compléter
alter table site_settings add column if not exists footer_adresse text default '';
alter table site_settings add column if not exists youtube_url text default '';

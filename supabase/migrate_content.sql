alter table site_settings add column if not exists mentions_legales text default '';
alter table site_settings add column if not exists politique_confidentialite text default '';
alter table site_settings add column if not exists texte_partenaires_cta text default 'Soutenez Trail Tafaray et associez votre image à un événement sportif engagé au cœur d’Anjeva.';
alter table site_settings add column if not exists email_partenariat text default 'trailtafaray@gmail.com';
alter table site_settings add column if not exists footer_texte text default 'Association organisatrice d''événements trail et VTT à Anjeva, Madagascar.';
alter table site_settings add column if not exists footer_email text default 'trailtafaray@gmail.com';
alter table site_settings add column if not exists footer_tel text default '';
alter table site_settings add column if not exists facebook_url text default '';
alter table site_settings add column if not exists instagram_url text default '';

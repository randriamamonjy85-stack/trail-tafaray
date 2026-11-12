-- Ajoute les images événement (page publique) et fond compte à rebours (accueil)
alter table site_settings
  add column if not exists evenement_image_url text,
  add column if not exists countdown_bg_url text;

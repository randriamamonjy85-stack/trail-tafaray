alter table site_settings add column if not exists pay_mvola_actif boolean default true;
alter table site_settings add column if not exists pay_orange_actif boolean default true;
alter table site_settings add column if not exists pay_airtel_actif boolean default true;
alter table site_settings add column if not exists notif_email_actif boolean default false;
alter table site_settings add column if not exists notif_sms_actif boolean default false;
alter table site_settings add column if not exists notif_email_from text default 'Trail Tafaray <noreply@trailtafaray.mg>';
alter table site_settings add column if not exists notif_message_valide text default 'Bonjour {prenom}, votre inscription {reference} ({course}) est validée. Misaotra / Merci — Trail Tafaray.';

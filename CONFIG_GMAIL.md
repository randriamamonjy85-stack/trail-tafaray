# Envoi des e-mails depuis trailtafaray@gmail.com

## 1. Créer un mot de passe d'application Google

1. Connectez-vous à https://myaccount.google.com avec **trailtafaray@gmail.com**
2. **Sécurité**
3. Activez la **Validation en deux étapes** (obligatoire)
4. Cherchez **Mots de passe des applications** (App passwords)
5. Application : *Mail* / autre nom : `Trail Tafaray Site`
6. Google affiche un code à **16 caractères** (ex. `abcd efgh ijkl mnop`)
7. Copiez-le **sans espaces** : `abcdefghijklmnop`

## 2. Variables Vercel

Settings → Environment Variables → ajouter :

| Key | Value |
|-----|--------|
| `SMTP_USER` | `trailtafaray@gmail.com` |
| `SMTP_PASS` | le mot de passe d'application (16 caractères) |
| `SMTP_FROM` | `Trail Tafaray <trailtafaray@gmail.com>` |
| `SMTP_HOST` | `smtp.gmail.com` *(optionnel, défaut déjà Gmail)* |
| `SMTP_PORT` | `465` *(optionnel)* |

Puis **Redeploy**.

## 3. Sur le site

Admin → Mobile Money → cocher **E-mail automatique** → Enregistrer.

Quand vous **Validez** une inscription qui a un e-mail, le message part depuis **trailtafaray@gmail.com**.

## Important

- N'utilisez **pas** le mot de passe Gmail normal
- Ne committez jamais `SMTP_PASS` dans Git
- Gmail limite le volume quotidien (adapté à une association, pas à des milliers de mails/jour)

# Configuration Vercel pour GazPoints

Ce document liste les variables d'environnement **obligatoires** à configurer dans le dashboard Vercel (Project Settings → Environment Variables) pour que l'envoi d'emails OTP fonctionne en production.

## Variables obligatoires

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL de connexion Neon PostgreSQL (pooler recommandé) | `postgresql://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require` |
| `BETTER_AUTH_SECRET` | Secret cryptographique (générer avec `openssl rand -base64 32`) | `abc123...` |
| `BETTER_AUTH_URL` | URL publique de l'API Better Auth (sans slash final) | `https://www.gazpoints.com` |
| `NEXT_PUBLIC_SITE_URL` | URL publique du site (pour les liens dans les emails) | `https://www.gazpoints.com` |
| `GMAIL_USER` | Adresse Gmail utilisée pour l'envoi (ex: `gazpoints@gmail.com`) | `gazpoints@gmail.com` |
| `GMAIL_APP_PASSWORD` | **App Password Gmail** (pas le mot de passe normal !) | `abcd efgh ijkl mnop` |
| `CONTACT_EMAIL` | Email de réception du formulaire de contact | `gazpoints@gmail.com` |
| `CRON_SECRET` | Secret pour protéger les endpoints cron (générer avec `openssl rand -base64 32`) | `xyz789...` |

## ⚠️ Important : Gmail App Password

**Le mot de passe Gmail normal NE FONCTIONNE PAS** pour l'envoi SMTP.

Vous devez :
1. Activer la **validation en 2 étapes (2FA)** sur le compte Gmail
2. Générer un **App Password** : https://myaccount.google.com/apppasswords
3. Utiliser cet App Password (16 caractères, sans espaces) dans `GMAIL_APP_PASSWORD`

## Vérification de la configuration

Une fois les variables configurées sur Vercel et le déploiement effectué :

1. Testez l'envoi email via l'endpoint de diagnostic :
   ```
   GET https://www.gazpoints.com/api/auth/email-otp/test-email?email=votre@email.com
   ```
   (En production, ajoutez l'en-tête `Authorization: Bearer <CRON_SECRET>`)

2. Réponse attendue en cas de succès :
   ```json
   {
     "status": "OK",
     "smtpVerify": "OK",
     "sendResult": { "accepted": ["votre@email.com"], "rejected": [], "response": "250 OK ..." }
   }
   ```

## Dépannage courant

| Symptôme | Cause probable | Solution |
|----------|----------------|----------|
| Email non reçu | `GMAIL_APP_PASSWORD` manquant ou incorrect | Régénérer l'App Password Gmail |
| Erreur "Email non configuré" | Variables Vercel non définies | Ajouter toutes les variables dans Vercel Dashboard |
| Erreur 500 sur envoi | Connexion SMTP bloquée | Vérifier les logs Vercel (Function Logs) |
| Code OTP invalide | Horloge serveur décalée | Rare sur Vercel, vérifier `expiresIn` |
| Compte créé mais pas d'email | Échec silencieux (ancien code) | Corrigé : l'erreur est maintenant affichée à l'utilisateur |

## Logs de diagnostic

Les logs structurés `[OTP-DIAG]` apparaissent dans les **Vercel Function Logs** :
- `ACCOUNT_FOUND` : Compte trouvé en base
- `GENERATING_OTP` : Génération du code OTP
- `OTP_GENERATED` : Code généré (longueur masquée)
- `LINK_TOKEN_STORED` : Jeton de lien stocké
- `SENDING_EMAIL` : Tentative d'envoi
- `EMAIL_SENT_OK` : Envoi confirmé par Gmail
- `EMAIL_SEND_FAILED` : Échec avec message d'erreur
- `RATE_LIMITED` : Limite de 60s atteinte
- `CLEANED_OLD_OTP` : Nettoyage des anciens codes

Ces logs permettent de tracer exactement où le processus échoue sans exposer de données sensibles.
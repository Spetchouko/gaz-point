-- 0018_add_last_login_to_user.sql
-- Ajout du champ lastLoginAt à la table user pour enregistrer
-- la date et heure de la dernière connexion réussie.

ALTER TABLE "user" ADD COLUMN "last_login_at" timestamp;

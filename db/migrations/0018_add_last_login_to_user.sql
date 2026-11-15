-- Migration : Ajout de last_login_at à la table user
-- Enregistre la date et heure de la dernière connexion réussie.
-- Cette colonne est requise par le schéma Drizzle de better-auth.

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp;

CREATE INDEX IF NOT EXISTS "user_last_login_at_idx" ON "user" ("last_login_at");

COMMENT ON COLUMN "user"."last_login_at" IS 'Date et heure de la dernière connexion réussie de l utilisateur.';

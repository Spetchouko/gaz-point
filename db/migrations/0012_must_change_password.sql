-- Migration : Ajout de must_change_password pour les collaborateurs
-- La valeur par défaut est false : aucun compte existant n'est impacté.

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "must_change_password" boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "user_must_change_password_idx" ON "user" ("must_change_password");

COMMENT ON COLUMN "user"."must_change_password" IS 'Indique si le collaborateur doit changer son mot de passe temporaire à la prochaine connexion. true = changement obligatoire, false = mot de passe déjà défini.';

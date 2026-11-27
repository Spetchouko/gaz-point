-- Migration : ajout du champ mode + champs pour mode composed
-- Appliquée manuellement via `psql $DATABASE_URL -f drizzle/0022_publicite_mode.sql`

ALTER TABLE "publicite" ADD COLUMN IF NOT EXISTS "mode" text NOT NULL DEFAULT 'composed';
ALTER TABLE "publicite" ADD COLUMN IF NOT EXISTS "text_align" text;
ALTER TABLE "publicite" ADD COLUMN IF NOT EXISTS "text_color" text;
ALTER TABLE "publicite" ADD COLUMN IF NOT EXISTS "background_overlay" text;
ALTER TABLE "publicite" ADD COLUMN IF NOT EXISTS "image_fit" text;
ALTER TABLE "publicite" ADD COLUMN IF NOT EXISTS "title_position" text;
ALTER TABLE "publicite" ADD COLUMN IF NOT EXISTS "description_position" text;

-- Commentaire pour documenter les valeurs possibles
COMMENT ON COLUMN "publicite"."mode" IS 'Type de publicité : composed (image + texte) ou full_banner (bannière complète pré-conçue)';

-- Index pour filtrer par mode si nécessaire
CREATE INDEX IF NOT EXISTS "publicite_mode_idx" ON "publicite" ("mode");
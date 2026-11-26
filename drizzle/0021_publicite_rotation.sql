-- Migration : ajout durée, priorité, ordre de diffusion pour les publicités
-- Appliquée manuellement via `psql $DATABASE_URL -f drizzle/0021_publicite_rotation.sql`

ALTER TABLE "publicite" ADD COLUMN IF NOT EXISTS "duration" integer;
ALTER TABLE "publicite" ADD COLUMN IF NOT EXISTS "priority" integer DEFAULT 0;
ALTER TABLE "publicite" ADD COLUMN IF NOT EXISTS "display_order" integer DEFAULT 0;

-- Index pour le tri par emplacement + ordre/priorité
CREATE INDEX IF NOT EXISTS "publicite_slot_order_idx" ON "publicite" ("slot", "display_order", "priority" DESC);
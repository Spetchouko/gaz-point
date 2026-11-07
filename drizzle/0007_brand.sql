-- Marques de bouteilles : liste unique, sans doublons (insensible à la casse et aux espaces)
CREATE TABLE IF NOT EXISTS "brand" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "name_key" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "brand_name_key_idx" ON "brand" ("name_key");

-- Reprise des marques déjà saisies dans les disponibilités existantes
INSERT INTO "brand" ("id", "name", "name_key")
SELECT gen_random_uuid()::text, MIN(btrim("brand")), lower(btrim("brand"))
FROM "disponibilite"
WHERE "brand" IS NOT NULL AND btrim("brand") <> ''
GROUP BY lower(btrim("brand"))
ON CONFLICT ("name_key") DO NOTHING;

-- Migration 0017 : inscription vendeur, brouillon et inventaire du dépôt.
-- Additive et idempotente : aucune donnée existante n'est supprimée.

-- Colonnes de services attendues par le schéma Drizzle (déjà présentes sur
-- certaines bases, absentes sur d'autres). Elles sont nécessaires au
-- dashboard vendeur qui charge le point de vente complet.
ALTER TABLE "point_de_vente" ADD COLUMN IF NOT EXISTS "delivery_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "point_de_vente" ADD COLUMN IF NOT EXISTS "delivery_fee" integer DEFAULT 0 NOT NULL;
ALTER TABLE "point_de_vente" ADD COLUMN IF NOT EXISTS "exchange_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "point_de_vente" ADD COLUMN IF NOT EXISTS "exchange_brands" text[] DEFAULT '{}'::text[];
ALTER TABLE "point_de_vente" ADD COLUMN IF NOT EXISTS "exchange_formats" text[] DEFAULT '{}'::text[];
ALTER TABLE "point_de_vente" ADD COLUMN IF NOT EXISTS "gas_sale_enabled" boolean DEFAULT false NOT NULL;

-- Colonnes de services des disponibilités (migration 0014 non appliquée sur
-- certaines bases). Le dashboard charge la disponibilité complète.
ALTER TABLE "disponibilite" ADD COLUMN IF NOT EXISTS "delivery" boolean DEFAULT false NOT NULL;
ALTER TABLE "disponibilite" ADD COLUMN IF NOT EXISTS "exchange" boolean DEFAULT false NOT NULL;
ALTER TABLE "disponibilite" ADD COLUMN IF NOT EXISTS "gas_sale" boolean DEFAULT false NOT NULL;

-- Références de bouteilles (marque + grammage) rattachées à un point de vente.
-- La quantité est la quantité réelle du dépôt, jamais une valeur fictive.
CREATE TABLE IF NOT EXISTS "point_de_vente_bouteille" (
  "id" text PRIMARY KEY NOT NULL,
  "point_de_vente_id" text NOT NULL REFERENCES "point_de_vente"("id") ON DELETE CASCADE,
  "brand_id" text NOT NULL REFERENCES "brand"("id") ON DELETE CASCADE,
  "format" text NOT NULL,
  "quantity" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "point_de_vente_bouteille" ADD COLUMN IF NOT EXISTS "quantity" integer DEFAULT 0 NOT NULL;
ALTER TABLE "point_de_vente_bouteille" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "point_de_vente_bouteille" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "point_de_vente_bouteille_unique_idx"
  ON "point_de_vente_bouteille" ("point_de_vente_id", "brand_id", "format");
CREATE INDEX IF NOT EXISTS "point_de_vente_bouteille_point_idx"
  ON "point_de_vente_bouteille" ("point_de_vente_id");
CREATE INDEX IF NOT EXISTS "point_de_vente_bouteille_brand_idx"
  ON "point_de_vente_bouteille" ("brand_id");

-- Brouillon d'inscription vendeur : une seule ligne par compte vendeur.
-- Les données sont conservées avant/après OTP et reprises dans la modale.
CREATE TABLE IF NOT EXISTS "vendor_onboarding" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
  "point_name" text NOT NULL,
  "district" text NOT NULL,
  "address" text NOT NULL,
  "phone" text,
  "brands" text[] DEFAULT '{}'::text[] NOT NULL,
  "inventory" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "point_de_vente_id" text REFERENCES "point_de_vente"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "vendor_onboarding_status_idx"
  ON "vendor_onboarding" ("status");
CREATE INDEX IF NOT EXISTS "vendor_onboarding_point_id_idx"
  ON "vendor_onboarding" ("point_de_vente_id");

COMMENT ON TABLE "vendor_onboarding" IS
  'Informations commerciales saisies à l''inscription vendeur, conservées jusqu''à la finalisation du point de vente.';

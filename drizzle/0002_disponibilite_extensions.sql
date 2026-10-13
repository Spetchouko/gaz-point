-- Add brand, weight_kg, expires_at and updated_at columns to disponibilite table
ALTER TABLE "disponibilite" ADD COLUMN "brand" text;
ALTER TABLE "disponibilite" ADD COLUMN "weight_kg" text;
ALTER TABLE "disponibilite" ADD COLUMN "expires_at" timestamp;
ALTER TABLE "disponibilite" ADD COLUMN "updated_at" timestamp NOT NULL DEFAULT now();
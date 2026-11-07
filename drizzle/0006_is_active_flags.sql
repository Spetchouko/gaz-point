-- Soft activation flags to support real enable/disable for users and points of sale
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;
ALTER TABLE "point_de_vente" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;
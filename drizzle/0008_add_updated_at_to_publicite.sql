-- Add updated_at column to publicite table if missing
ALTER TABLE "publicite" ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
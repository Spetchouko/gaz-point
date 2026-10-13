-- Marketing & publicities (GAZ POINT advertisement banners)
CREATE TABLE IF NOT EXISTS "publicite" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "image" text,
  "price" integer,
  "price_label" text,
  "location" text,
  "phone" text,
  "link_url" text,
  "slot" text NOT NULL DEFAULT 'home_hero',
  "status" text NOT NULL DEFAULT 'active',
  "start_at" timestamp,
  "end_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "publicite_slot_status_idx" ON "publicite" ("slot", "status");
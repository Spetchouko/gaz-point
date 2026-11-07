-- Avis / témoignages (auteurs client ou vendeur) modérés par l'administration
CREATE TABLE IF NOT EXISTS "avis" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "author_name" text NOT NULL,
  "author_role" text NOT NULL,
  "author_image" text,
  "city" text,
  "quote" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "avis_status_created_idx" ON "avis" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "avis_user_id_idx" ON "avis" ("user_id");

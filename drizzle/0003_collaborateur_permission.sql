-- Collaborative permissions: module access for collaborateur accounts (admin has all modules)
CREATE TABLE IF NOT EXISTS "collaborateur_permission" (
  "id" text PRIMARY KEY NOT NULL,
  "collaborator_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "module" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "collaborateur_permission_collab_idx" ON "collaborateur_permission" ("collaborator_id");
CREATE UNIQUE INDEX IF NOT EXISTS "collaborateur_permission_module_idx" ON "collaborateur_permission" ("collaborator_id", "module");
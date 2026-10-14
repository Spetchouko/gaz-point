-- Migration 0012: suivi des performances publicitaires.
-- Événements first-party (impression, clic, conversion), consentement requis,
-- sans donnée personnelle (aucune adresse IP, identifiants aléatoires seulement).
CREATE TABLE IF NOT EXISTS "publicite_event" (
  "id" text PRIMARY KEY NOT NULL,
  "publicite_id" text NOT NULL REFERENCES "publicite"("id") ON DELETE CASCADE,
  "event_type" text NOT NULL,
  "conversion_type" text,
  "slot" text,
  "source_category" text,
  "referrer_host" text,
  "utm_source" text,
  "utm_medium" text,
  "utm_campaign" text,
  "path" text,
  "visitor_id" text,
  "session_id" text,
  "attribution_window_days" integer,
  "consented" boolean NOT NULL DEFAULT false,
  "event_key" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "publicite_event_event_key_idx" ON "publicite_event" ("event_key");
CREATE INDEX IF NOT EXISTS "publicite_event_publicite_id_idx" ON "publicite_event" ("publicite_id");
CREATE INDEX IF NOT EXISTS "publicite_event_created_at_idx" ON "publicite_event" ("created_at");
CREATE INDEX IF NOT EXISTS "publicite_event_type_created_idx" ON "publicite_event" ("event_type", "created_at");

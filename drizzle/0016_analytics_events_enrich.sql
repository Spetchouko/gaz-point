-- Enrichissement des événements analytics first-party
-- Ajout de session_id (regroupement d'événements par session anonyme)
-- et metadata (JSON des métadonnées strictement nécessaires, sans PII)

ALTER TABLE "traffic_event" ADD COLUMN IF NOT EXISTS "session_id" text;
ALTER TABLE "traffic_event" ADD COLUMN IF NOT EXISTS "metadata" jsonb;

CREATE INDEX IF NOT EXISTS "traffic_event_session_id_idx" ON "traffic_event" ("session_id");
CREATE INDEX IF NOT EXISTS "traffic_event_event_type_created_idx" ON "traffic_event" ("event_type", "created_at");

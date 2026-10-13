-- First-party, consent-aware analytics events (never stores PII)
CREATE TABLE IF NOT EXISTS "traffic_event" (
  "id" text PRIMARY KEY NOT NULL,
  "event_type" text NOT NULL,
  "path" text,
  "referrer" text,
  "utm_source" text,
  "utm_medium" text,
  "utm_campaign" text,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "consented" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "traffic_event_created_at_idx" ON "traffic_event" ("created_at");
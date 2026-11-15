-- Migration : Création de la table notification
-- Centre de notifications pour les trois dashboards (client, vendeur, administrateur)
-- Chaque notification est liée à un utilisateur et peut être lue/non lue, archivée.

CREATE TABLE IF NOT EXISTS "notification" (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'reservation' | 'availability' | 'system' | 'promo' | 'admin'
  title text NOT NULL,
  message text NOT NULL,
  link text, -- URL de destination optionnelle au clic sur la notification
  read boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "notification_user_id_idx" ON "notification" ("user_id");
CREATE INDEX IF NOT EXISTS "notification_read_idx" ON "notification" ("read");
CREATE INDEX IF NOT EXISTS "notification_archived_idx" ON "notification" ("archived");
CREATE INDEX IF NOT EXISTS "notification_user_created_idx" ON "notification" ("user_id", "created_at");

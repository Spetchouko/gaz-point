-- Ajout de la note (1 à 5) sur les avis existants.
-- Migration additive et idempotente : aucune donnée n'est supprimée ni réécrite.
ALTER TABLE "avis" ADD COLUMN IF NOT EXISTS "rating" integer;

-- Un seul avis par utilisateur. L'index n'est créé que si les données
-- existantes ne contiennent pas déjà de doublons.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "avis" GROUP BY "user_id" HAVING COUNT(*) > 1) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS "avis_user_id_unique_idx" ON "avis" ("user_id");
  END IF;
END $$;

-- Migration : ajout des colonnes GPS à la table point_de_vente
-- Permet le calcul de distance pour le tri géolocalisé des disponibilités.
ALTER TABLE point_de_vente
ADD COLUMN IF NOT EXISTS latitude TEXT;

ALTER TABLE point_de_vente
ADD COLUMN IF NOT EXISTS longitude TEXT;

-- Index optionnel pour accélérer les requêtes géospatiales futures
CREATE INDEX IF NOT EXISTS point_de_vente_latitude_idx ON point_de_vente(latitude);
CREATE INDEX IF NOT EXISTS point_de_vente_longitude_idx ON point_de_vente(longitude);

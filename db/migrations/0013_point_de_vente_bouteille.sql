-- Migration : Table point_de_vente_bouteille
-- Permet de lier les points de vente à leurs bouteilles (marque + grammage)
-- Cette table évite les doublons pour la même combinaison marque/grammage par point de vente

-- Création de la table point_de_vente_bouteille
CREATE TABLE IF NOT EXISTS point_de_vente_bouteille (
  id text NOT NULL PRIMARY KEY,
  point_de_vente_id text NOT NULL,
  brand_id text NOT NULL,
  format text NOT NULL,
  CONSTRAINT point_de_vente_bouteille_point_brand_format_unique
    UNIQUE (point_de_vente_id, brand_id, format)
);

-- Index pour les recherches par point de vente
CREATE INDEX IF NOT EXISTS point_de_vente_bouteille_point_idx
  ON point_de_vente_bouteille (point_de_vente_id);

-- Index pour les recherches par marque
CREATE INDEX IF NOT EXISTS point_de_vente_bouteille_brand_idx
  ON point_de_vente_bouteille (brand_id);

-- Contrainte de clé étrangère vers point_de_vente
ALTER TABLE point_de_vente_bouteille
  ADD CONSTRAINT point_de_vente_bouteille_point_de_vente_id_fkey
  FOREIGN KEY (point_de_vente_id) REFERENCES point_de_vente (id) ON DELETE CASCADE;

-- Contrainte de clé étrangère vers brand
ALTER TABLE point_de_vente_bouteille
  ADD CONSTRAINT point_de_vente_bouteille_brand_id_fkey
  FOREIGN KEY (brand_id) REFERENCES brand (id) ON DELETE CASCADE;

COMMENT ON TABLE point_de_vente_bouteille IS 'Lie les points de vente à leurs bouteilles (marque + grammage). Permet d\'éviter les doublons pour la même combinaison marque/grammage par point de vente.';
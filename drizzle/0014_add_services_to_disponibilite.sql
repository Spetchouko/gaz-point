-- Add services columns to disponibilite table
ALTER TABLE disponibilite 
ADD COLUMN IF NOT EXISTS delivery boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS exchange boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS gas_sale boolean DEFAULT false NOT NULL;
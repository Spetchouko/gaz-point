ALTER TABLE "point_de_vente" ADD COLUMN IF NOT EXISTS "exchange_fee" integer;
ALTER TABLE "point_de_vente" ADD COLUMN IF NOT EXISTS "gas_sale_fee" integer;
ALTER TABLE "point_de_vente" ADD COLUMN IF NOT EXISTS "gas_sale_brands" text[] DEFAULT '{}'::text[];
ALTER TABLE "point_de_vente" ADD COLUMN IF NOT EXISTS "gas_sale_formats" text[] DEFAULT '{}'::text[];

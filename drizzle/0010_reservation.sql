-- Migration 0010: Add reservation table for client gas bottle reservations

CREATE TABLE IF NOT EXISTS "reservation" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "client_name" TEXT NOT NULL,
    "client_phone" TEXT,
    "vendor_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "point_id" TEXT NOT NULL REFERENCES "point_de_vente"("id") ON DELETE CASCADE,
    "disponibilite_id" TEXT REFERENCES "disponibilite"("id") ON DELETE SET NULL,
    "brand" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "reservation_code" TEXT NOT NULL UNIQUE,
    "amount" INTEGER NOT NULL DEFAULT 1000,
    "amount_type" TEXT NOT NULL DEFAULT 'reservation',
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "reserved_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "collected_at" TIMESTAMP,
    "cancelled_at" TIMESTAMP,
    "expires_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "reservation_user_id_idx" ON "reservation"("user_id");
CREATE INDEX IF NOT EXISTS "reservation_vendor_id_idx" ON "reservation"("vendor_id");
CREATE INDEX IF NOT EXISTS "reservation_point_id_idx" ON "reservation"("point_id");
CREATE INDEX IF NOT EXISTS "reservation_code_idx" ON "reservation"("reservation_code");
CREATE INDEX IF NOT EXISTS "reservation_status_idx" ON "reservation"("status");
CREATE INDEX IF NOT EXISTS "reservation_reserved_at_idx" ON "reservation"("reserved_at");

-- Add reserved_quantity column to disponibilite to track reserved vs available stock
ALTER TABLE "disponibilite" ADD COLUMN IF NOT EXISTS "reserved_quantity" INTEGER NOT NULL DEFAULT 0;
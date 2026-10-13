-- Migration: Add vendor approval fields to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "approval_status" TEXT DEFAULT 'none' NOT NULL;
-- 'none' = not requested (default for existing vendors)
-- 'pending' = requested approval, waiting for admin
-- 'approved' = admin approved, can publish
-- 'rejected' = admin rejected

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "approval_requested_at" TIMESTAMP;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "approval_processed_at" TIMESTAMP;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "approval_processed_by" TEXT REFERENCES "user"("id") ON DELETE SET NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "user_approval_status_idx" ON "user"("approval_status");

-- Update existing vendors to 'approved' by default so they can continue publishing
UPDATE "user" SET "approval_status" = 'approved' WHERE "role" = 'vendor' AND "approval_status" = 'none';
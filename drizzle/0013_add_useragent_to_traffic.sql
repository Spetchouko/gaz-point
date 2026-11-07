-- Migration: Add userAgent and screen resolution tracking to traffic_event
-- This enables device, OS, browser, and screen resolution analytics

ALTER TABLE traffic_event
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS screen_width integer,
ADD COLUMN IF NOT EXISTS screen_height integer,
ADD COLUMN IF NOT EXISTS viewport_width integer,
ADD COLUMN IF NOT EXISTS viewport_height integer;

-- Add index for user_agent queries
CREATE INDEX IF NOT EXISTS traffic_event_user_agent_idx ON traffic_event (user_agent);
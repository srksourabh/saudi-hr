-- Migration 0005: Add guide_maps table for saved map views
-- Managers can save map views (center, zoom, name) to share with team members.
-- Saved maps show employee locations with status-colored markers.

BEGIN;

CREATE TABLE IF NOT EXISTS "guide_maps" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" TEXT NOT NULL,
  "center_lat" DECIMAL(10, 7) NOT NULL,
  "center_lng" DECIMAL(10, 7) NOT NULL,
  "zoom" TEXT NOT NULL DEFAULT '12',
  "created_by" UUID REFERENCES users(id) ON DELETE SET NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "guide_maps_created_by_idx" ON "guide_maps" ("created_by");
CREATE INDEX IF NOT EXISTS "guide_maps_created_at_idx" ON "guide_maps" ("created_at");

COMMIT;

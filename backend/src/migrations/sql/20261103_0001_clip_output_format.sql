-- Framing mode used when this clip was rendered (supports multi-format tasks).
ALTER TABLE generated_clips ADD COLUMN IF NOT EXISTS output_format VARCHAR(32);

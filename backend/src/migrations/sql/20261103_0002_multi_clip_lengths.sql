ALTER TABLE "users" ALTER COLUMN "default_clip_length" TYPE VARCHAR(64);
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_default_clip_length_check";

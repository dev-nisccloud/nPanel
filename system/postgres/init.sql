-- Runs once on first container start (only if the data volume is empty).
-- Add any extensions or initial setup here.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "citext";

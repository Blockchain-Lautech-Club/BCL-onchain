-- create_all() does not alter existing tables. Run once on an existing database:
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

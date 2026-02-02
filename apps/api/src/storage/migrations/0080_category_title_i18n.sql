-- Migrate category title from text to jsonb for i18n support
-- Existing titles are migrated to the 'en' locale

-- First, drop the unique constraint that exists on the text column
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_title_unique;

-- Then alter the column type to jsonb
ALTER TABLE categories
ALTER COLUMN title TYPE jsonb
USING jsonb_build_object('en', title);

-- Note: Category uniqueness will now be enforced at the application level
-- since JSONB fields don't support traditional unique constraints

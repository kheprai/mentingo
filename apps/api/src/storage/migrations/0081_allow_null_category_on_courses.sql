-- Allow courses to have NULL categoryId
-- This enables deleting categories without affecting courses

-- First drop the existing foreign key constraint
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_category_id_categories_id_fk;

-- Make the column nullable
ALTER TABLE courses ALTER COLUMN category_id DROP NOT NULL;

-- Re-add the foreign key with ON DELETE SET NULL
ALTER TABLE courses
ADD CONSTRAINT courses_category_id_categories_id_fk
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

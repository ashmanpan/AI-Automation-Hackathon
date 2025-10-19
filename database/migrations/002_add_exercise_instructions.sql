-- Migration: Add instructions field to exercises table
-- This allows admins to provide step-by-step guides for each exercise

-- Add instructions column to exercises table
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Add rubric column if it doesn't exist (for AI grading criteria)
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS rubric TEXT;

-- Add comment to document the fields
COMMENT ON COLUMN exercises.instructions IS 'Step-by-step user guide for completing the exercise. Can be formatted as markdown or plain text.';
COMMENT ON COLUMN exercises.rubric IS 'Grading rubric/criteria for the exercise. Used by AI and judges for consistent evaluation.';

-- Example usage:
-- UPDATE exercises SET instructions = E'# Steps to Complete\n\n1. Setup your environment\n2. Create the API endpoints\n3. Test your implementation\n4. Submit your code' WHERE id = 1;

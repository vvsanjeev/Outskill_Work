/*
  # Create Subtasks Table

  1. New Tables
    - `subtasks`
      - `id` (uuid, primary key) - Unique identifier for each subtask
      - `task_id` (uuid, foreign key) - References tasks(id) to link subtasks to main tasks
      - `user_id` (uuid, foreign key) - References auth.users(id) to link subtasks to users
      - `title` (text) - The subtask description/title
      - `completed` (boolean) - Whether the subtask is completed or not
      - `created_at` (timestamptz) - Timestamp when subtask was created
      - `updated_at` (timestamptz) - Timestamp when subtask was last updated

  2. Security
    - Enable RLS on `subtasks` table
    - Add policy for authenticated users to read their own subtasks
    - Add policy for authenticated users to insert their own subtasks
    - Add policy for authenticated users to update their own subtasks
    - Add policy for authenticated users to delete their own subtasks

  3. Indexes
    - Add index on task_id for faster queries
    - Add index on user_id for filtering
*/

CREATE TABLE IF NOT EXISTS subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own subtasks"
  ON subtasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subtasks"
  ON subtasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subtasks"
  ON subtasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subtasks"
  ON subtasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS subtasks_task_id_idx ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS subtasks_user_id_idx ON subtasks(user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_subtasks_updated_at
  BEFORE UPDATE ON subtasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
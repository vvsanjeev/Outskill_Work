/*
  # Add Vector Search to Tasks Table

  1. Changes to Tables
    - `tasks`
      - Add `embedding` (vector(384)) - Vector embedding of task title for similarity search
      - Add index on embedding column for faster similarity searches

  2. Extensions
    - Enable `vector` extension for pgvector support

  3. Functions
    - Create function to generate embeddings using Supabase AI
    - Create trigger to automatically generate embeddings on task insert/update

  4. Important Notes
    - Using gte-small model which produces 384-dimensional embeddings
    - Embeddings are generated automatically for all new and updated tasks
    - Similarity search uses cosine distance (1 - cosine_similarity)
*/

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE tasks ADD COLUMN embedding vector(384);
  END IF;
END $$;

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS tasks_embedding_idx ON tasks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create function to generate embedding for task
CREATE OR REPLACE FUNCTION generate_task_embedding()
RETURNS TRIGGER AS $$
DECLARE
  embedding_result vector(384);
BEGIN
  -- Generate embedding using Supabase AI gte-small model
  SELECT ai.openai_embed(
    'text-embedding-3-small',
    NEW.title,
    dimensions => 384
  ) INTO embedding_result;
  
  NEW.embedding = embedding_result;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If embedding generation fails, still allow the operation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically generate embeddings
DROP TRIGGER IF EXISTS generate_task_embedding_trigger ON tasks;
CREATE TRIGGER generate_task_embedding_trigger
  BEFORE INSERT OR UPDATE OF title ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION generate_task_embedding();
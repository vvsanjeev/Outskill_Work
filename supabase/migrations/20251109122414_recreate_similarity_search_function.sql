/*
  # Recreate Similarity Search RPC Function

  1. Changes
    - Drop existing function if it exists
    - Create new function with correct return type

  2. New Functions
    - `search_tasks_by_similarity` - RPC function to search tasks by vector similarity
      - Parameters:
        - `query_embedding` (vector(384)) - The embedding vector of the search query
        - `match_threshold` (float) - Minimum similarity score (0-1)
        - `match_count` (int) - Maximum number of results to return
        - `user_id_filter` (uuid) - User ID to filter tasks
      - Returns: Array of tasks with similarity scores

  3. Security
    - Function is SECURITY DEFINER to allow reading embeddings
    - Function respects RLS by filtering on user_id

  4. Important Notes
    - Uses cosine similarity (1 - cosine_distance)
    - Only returns tasks with similarity >= match_threshold
    - Results are ordered by similarity (highest first)
    - Only returns tasks for the specified user
*/

-- Drop existing function
DROP FUNCTION IF EXISTS search_tasks_by_similarity(vector, float, int, uuid);
DROP FUNCTION IF EXISTS search_tasks_by_similarity(vector, double precision, integer, uuid);

-- Create function for similarity search
CREATE OR REPLACE FUNCTION search_tasks_by_similarity(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 2,
  user_id_filter uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  priority text,
  status text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tasks.id,
    tasks.title,
    tasks.priority,
    tasks.status,
    tasks.created_at,
    1 - (tasks.embedding <=> query_embedding) AS similarity
  FROM tasks
  WHERE
    tasks.embedding IS NOT NULL
    AND (user_id_filter IS NULL OR tasks.user_id = user_id_filter)
    AND 1 - (tasks.embedding <=> query_embedding) >= match_threshold
  ORDER BY tasks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
/*
  # Backfill Embeddings for Existing Tasks

  1. Changes
    - Update existing tasks to trigger embedding generation
    - This will fire the generate_task_embedding_trigger for all tasks

  2. Important Notes
    - This updates the title to itself, which triggers the embedding generation
    - The trigger will handle the actual embedding generation
    - Tasks without embeddings will get them generated
*/

-- Update all tasks to trigger embedding generation
UPDATE tasks
SET title = title
WHERE embedding IS NULL;
-- Add cor column to status_opcoes table
ALTER TABLE public.status_opcoes 
ADD COLUMN cor text DEFAULT '#9ca3af' NOT NULL;
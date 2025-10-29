-- Remove todos os triggers relacionados a updated_at na tabela scripts
DROP TRIGGER IF EXISTS update_scripts_updated_at ON public.scripts;
DROP TRIGGER IF EXISTS update_updated_at_column_trigger ON public.scripts;
DROP TRIGGER IF EXISTS trigger_update_updated_at ON public.scripts;
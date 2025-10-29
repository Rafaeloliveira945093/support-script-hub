-- Ensure function exists
CREATE OR REPLACE FUNCTION public.update_scripts_ultima_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultima_atualizacao = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Replace trigger to call correct function
DROP TRIGGER IF EXISTS update_scripts_ultima_atualizacao ON public.scripts;
CREATE TRIGGER update_scripts_ultima_atualizacao
BEFORE UPDATE ON public.scripts
FOR EACH ROW
EXECUTE FUNCTION public.update_scripts_ultima_atualizacao();
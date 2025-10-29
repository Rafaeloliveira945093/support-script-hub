-- Apenas recria a função (o trigger já existe)
CREATE OR REPLACE FUNCTION public.update_scripts_ultima_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultima_atualizacao = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
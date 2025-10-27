-- Criar tabela de estruturantes
CREATE TABLE IF NOT EXISTS public.estruturantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Criar tabela de status
CREATE TABLE IF NOT EXISTS public.status_opcoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Adicionar campo de links aos chamados (array de objetos JSON)
ALTER TABLE public.chamados 
ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;

-- Enable RLS
ALTER TABLE public.estruturantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_opcoes ENABLE ROW LEVEL SECURITY;

-- Policies para estruturantes
CREATE POLICY "Anyone can view estruturantes" 
ON public.estruturantes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create estruturantes" 
ON public.estruturantes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own estruturantes" 
ON public.estruturantes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own estruturantes" 
ON public.estruturantes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policies para status_opcoes
CREATE POLICY "Anyone can view status opcoes" 
ON public.status_opcoes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create status opcoes" 
ON public.status_opcoes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own status opcoes" 
ON public.status_opcoes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own status opcoes" 
ON public.status_opcoes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_estruturantes_updated_at
BEFORE UPDATE ON public.estruturantes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_status_opcoes_updated_at
BEFORE UPDATE ON public.status_opcoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir alguns valores padrão
INSERT INTO public.status_opcoes (nome, user_id)
SELECT 'Aberto', id FROM auth.users LIMIT 1
ON CONFLICT (nome) DO NOTHING;

INSERT INTO public.status_opcoes (nome, user_id)
SELECT 'Em andamento', id FROM auth.users LIMIT 1
ON CONFLICT (nome) DO NOTHING;

INSERT INTO public.status_opcoes (nome, user_id)
SELECT 'Fechado', id FROM auth.users LIMIT 1
ON CONFLICT (nome) DO NOTHING;
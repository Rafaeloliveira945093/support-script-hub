-- Adicionar campo de número de chamado customizado
ALTER TABLE public.chamados 
ADD COLUMN numero_chamado TEXT UNIQUE;

-- Criar índice para melhorar performance de busca
CREATE INDEX idx_chamados_numero_chamado ON public.chamados(numero_chamado);

-- Criar tabela de links úteis
CREATE TABLE public.links_uteis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela links_uteis
ALTER TABLE public.links_uteis ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para links_uteis
-- Todos podem visualizar links
CREATE POLICY "Anyone can view links"
ON public.links_uteis
FOR SELECT
USING (true);

-- Usuários autenticados podem criar links
CREATE POLICY "Authenticated users can create links"
ON public.links_uteis
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios links
CREATE POLICY "Users can update their own links"
ON public.links_uteis
FOR UPDATE
USING (auth.uid() = user_id);

-- Usuários podem deletar seus próprios links
CREATE POLICY "Users can delete their own links"
ON public.links_uteis
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_links_uteis_updated_at
BEFORE UPDATE ON public.links_uteis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- 1. Criar tabela de logs de auditoria para chamados
CREATE TABLE public.chamado_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID NOT NULL,
  user_id UUID NOT NULL,
  acao TEXT NOT NULL,
  campo_alterado TEXT,
  valor_antigo TEXT,
  valor_novo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Adicionar colunas de última edição em chamados
ALTER TABLE public.chamados
ADD COLUMN last_edited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN last_edited_by UUID;

-- 3. Criar tabela de links separada
CREATE TABLE public.chamado_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID NOT NULL,
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- 4. Enable RLS para chamado_logs
ALTER TABLE public.chamado_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs of their chamados"
ON public.chamado_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chamados
    WHERE chamados.id = chamado_logs.chamado_id
    AND chamados.user_id = auth.uid()
  )
);

CREATE POLICY "System can create logs"
ON public.chamado_logs
FOR INSERT
WITH CHECK (true);

-- 5. Enable RLS para chamado_links
ALTER TABLE public.chamado_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view links of their chamados"
ON public.chamado_links
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chamados
    WHERE chamados.id = chamado_links.chamado_id
    AND chamados.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create links on their chamados"
ON public.chamado_links
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.chamados
    WHERE chamados.id = chamado_links.chamado_id
    AND chamados.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete links of their chamados"
ON public.chamado_links
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.chamados
    WHERE chamados.id = chamado_links.chamado_id
    AND chamados.user_id = auth.uid()
  )
);

-- 6. Criar índices para performance
CREATE INDEX idx_chamado_logs_chamado_id ON public.chamado_logs(chamado_id);
CREATE INDEX idx_chamado_logs_created_at ON public.chamado_logs(created_at);
CREATE INDEX idx_chamado_links_chamado_id ON public.chamado_links(chamado_id);
CREATE INDEX idx_chamados_last_edited_at ON public.chamados(last_edited_at DESC);
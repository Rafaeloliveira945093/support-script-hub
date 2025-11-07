-- Adicionar campo data_prazo aos chamados
ALTER TABLE public.chamados ADD COLUMN data_prazo timestamp with time zone;

-- Criar tabela de notificações
CREATE TABLE public.notificacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  chamado_id uuid NOT NULL,
  mensagem text NOT NULL,
  visualizada boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- RLS policies para notificações
CREATE POLICY "Users can view their own notificacoes"
ON public.notificacoes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notificacoes"
ON public.notificacoes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notificacoes"
ON public.notificacoes
FOR INSERT
WITH CHECK (true);

-- Index para performance
CREATE INDEX idx_notificacoes_user_id ON public.notificacoes(user_id);
CREATE INDEX idx_notificacoes_visualizada ON public.notificacoes(visualizada) WHERE visualizada = false;
-- Adicionar campos ao perfil do usuário
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cargo TEXT,
ADD COLUMN IF NOT EXISTS telefone TEXT,
ADD COLUMN IF NOT EXISTS horario_inicio TIME,
ADD COLUMN IF NOT EXISTS horario_fim TIME;

-- Criar tabela de pausas do usuário
CREATE TABLE IF NOT EXISTS public.usuario_pausas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela usuario_pausas
ALTER TABLE public.usuario_pausas ENABLE ROW LEVEL SECURITY;

-- Políticas para usuario_pausas
CREATE POLICY "Users can view their own pausas"
ON public.usuario_pausas FOR SELECT
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can create their own pausas"
ON public.usuario_pausas FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own pausas"
ON public.usuario_pausas FOR UPDATE
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own pausas"
ON public.usuario_pausas FOR DELETE
USING (auth.uid() = usuario_id);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuario_pausas_usuario_id ON public.usuario_pausas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_chamado_logs_chamado_id ON public.chamado_logs(chamado_id);
CREATE INDEX IF NOT EXISTS idx_chamado_logs_created_at ON public.chamado_logs(created_at);
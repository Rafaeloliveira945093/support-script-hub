-- Adicionar campos para registro de datas e horários na tabela chamados
ALTER TABLE public.chamados
ADD COLUMN data_encerramento TIMESTAMP WITH TIME ZONE,
ADD COLUMN data_encaminhamento TIMESTAMP WITH TIME ZONE,
ADD COLUMN nivel_encaminhado INTEGER;

-- Adicionar comentários para documentar os campos
COMMENT ON COLUMN public.chamados.data_encerramento IS 'Data e hora em que o chamado foi encerrado';
COMMENT ON COLUMN public.chamados.data_encaminhamento IS 'Data e hora em que o chamado foi encaminhado para outro nível';
COMMENT ON COLUMN public.chamados.nivel_encaminhado IS 'Nível para o qual o chamado foi encaminhado (N2, N3, etc)';
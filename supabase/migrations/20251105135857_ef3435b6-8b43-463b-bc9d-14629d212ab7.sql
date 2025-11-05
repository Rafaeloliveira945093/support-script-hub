-- Add anotacoes_internas column to chamados table
ALTER TABLE public.chamados
ADD COLUMN IF NOT EXISTS anotacoes_internas text DEFAULT '';
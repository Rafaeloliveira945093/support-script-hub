-- Permitir DELETE de chamados pelos próprios usuários
DROP POLICY IF EXISTS "Users can delete their own chamados" ON public.chamados;

CREATE POLICY "Users can delete their own chamados" 
ON public.chamados 
FOR DELETE 
USING (auth.uid() = user_id);

-- Permitir DELETE de respostas pelos próprios usuários
DROP POLICY IF EXISTS "Users can delete their own respostas" ON public.respostas;

CREATE POLICY "Users can delete their own respostas" 
ON public.respostas 
FOR DELETE 
USING (auth.uid() = user_id);
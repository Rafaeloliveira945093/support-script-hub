-- Atualizar políticas RLS para garantir que cada usuário veja apenas seus próprios dados

-- Tabela chamados: Remover acesso de admin/support, permitir apenas próprio usuário
DROP POLICY IF EXISTS "Users can view relevant chamados" ON public.chamados;

CREATE POLICY "Users can view their own chamados" 
ON public.chamados 
FOR SELECT 
USING (auth.uid() = user_id);

-- Tabela scripts: Restringir para apenas próprio usuário
DROP POLICY IF EXISTS "Users can view all scripts" ON public.scripts;

CREATE POLICY "Users can view their own scripts" 
ON public.scripts 
FOR SELECT 
USING (auth.uid() = user_id);

-- Tabela estruturantes: Restringir para apenas próprio usuário
DROP POLICY IF EXISTS "Anyone can view estruturantes" ON public.estruturantes;

CREATE POLICY "Users can view their own estruturantes" 
ON public.estruturantes 
FOR SELECT 
USING (auth.uid() = user_id);

-- Tabela status_opcoes: Restringir para apenas próprio usuário
DROP POLICY IF EXISTS "Anyone can view status opcoes" ON public.status_opcoes;

CREATE POLICY "Users can view their own status opcoes" 
ON public.status_opcoes 
FOR SELECT 
USING (auth.uid() = user_id);

-- Tabela links_uteis: Restringir para apenas próprio usuário
DROP POLICY IF EXISTS "Anyone can view links" ON public.links_uteis;

CREATE POLICY "Users can view their own links" 
ON public.links_uteis 
FOR SELECT 
USING (auth.uid() = user_id);
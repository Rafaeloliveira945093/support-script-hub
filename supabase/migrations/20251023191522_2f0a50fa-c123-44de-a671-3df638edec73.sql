-- Criar tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome_completo)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nome_completo', new.email)
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criar tabela de chamados
CREATE TABLE public.chamados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aberto',
  nivel INTEGER NOT NULL CHECK (nivel IN (1, 2, 3)),
  estruturante TEXT NOT NULL,
  descricao_usuario TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para chamados
CREATE POLICY "Users can view all chamados"
ON public.chamados FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create chamados"
ON public.chamados FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chamados"
ON public.chamados FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Criar tabela de respostas
CREATE TABLE public.respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID REFERENCES public.chamados(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  conteudo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('usuario', 'atendente')),
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.respostas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para respostas
CREATE POLICY "Users can view respostas of their chamados"
ON public.respostas FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chamados
    WHERE chamados.id = respostas.chamado_id
    AND chamados.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create respostas on their chamados"
ON public.respostas FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.chamados
    WHERE chamados.id = respostas.chamado_id
    AND chamados.user_id = auth.uid()
  )
);

-- Criar tabela de scripts
CREATE TABLE public.scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estruturante TEXT NOT NULL,
  nivel INTEGER NOT NULL CHECK (nivel IN (1, 2, 3)),
  titulo_script TEXT NOT NULL,
  descricao_script TEXT,
  conteudo_script TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para scripts
CREATE POLICY "Users can view all scripts"
ON public.scripts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create scripts"
ON public.scripts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scripts"
ON public.scripts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scripts"
ON public.scripts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at em chamados
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_chamados_updated_at
BEFORE UPDATE ON public.chamados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar ultima_atualizacao em scripts
CREATE TRIGGER update_scripts_ultima_atualizacao
BEFORE UPDATE ON public.scripts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
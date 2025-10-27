import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Plus, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Link = {
  nome: string;
  url: string;
};

const NovoChamado = () => {
  const [titulo, setTitulo] = useState("");
  const [numeroChamado, setNumeroChamado] = useState("");
  const [nivel, setNivel] = useState<string>("");
  const [estruturante, setEstruturante] = useState("");
  const [status, setStatus] = useState("");
  const [descricao, setDescricao] = useState("");
  const [links, setLinks] = useState<Link[]>([]);
  const [estruturantes, setEstruturantes] = useState<string[]>([]);
  const [statusOpcoes, setStatusOpcoes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchEstruturantes();
    fetchStatusOpcoes();
  }, []);

  const fetchEstruturantes = async () => {
    try {
      const { data, error } = await supabase
        .from("estruturantes")
        .select("nome")
        .order("nome");

      if (error) throw error;
      setEstruturantes(data?.map(e => e.nome) || []);
    } catch (error: any) {
      console.error("Erro ao carregar estruturantes:", error);
    }
  };

  const fetchStatusOpcoes = async () => {
    try {
      const { data, error } = await supabase
        .from("status_opcoes")
        .select("nome")
        .order("nome");

      if (error) throw error;
      setStatusOpcoes(data?.map(s => s.nome) || []);
      if (data && data.length > 0) {
        setStatus(data[0].nome);
      }
    } catch (error: any) {
      console.error("Erro ao carregar status:", error);
    }
  };

  const adicionarLink = () => {
    setLinks([...links, { nome: "", url: "" }]);
  };

  const removerLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const atualizarLink = (index: number, campo: keyof Link, valor: string) => {
    const novosLinks = [...links];
    novosLinks[index][campo] = valor;
    setLinks(novosLinks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo || !nivel || !estruturante || !status || !descricao) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Validar links
    const linksValidos = links.filter(link => link.nome.trim() && link.url.trim());
    for (const link of linksValidos) {
      if (!link.url.startsWith("http://") && !link.url.startsWith("https://")) {
        toast({
          title: "Erro",
          description: "Todos os links devem começar com http:// ou https://",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Validar duplicidade de número de chamado se preenchido
      if (numeroChamado.trim()) {
        const { data: existingChamado } = await supabase
          .from("chamados")
          .select("id")
          .eq("numero_chamado", numeroChamado.trim())
          .maybeSingle();

        if (existingChamado) {
          toast({
            title: "ID já existe",
            description: "Este número de chamado já está em uso. Por favor, escolha outro.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      const linksValidos = links.filter(link => link.nome.trim() && link.url.trim());

      const { data, error } = await supabase
        .from("chamados")
        .insert({
          titulo,
          numero_chamado: numeroChamado.trim() || null,
          nivel: parseInt(nivel),
          estruturante,
          descricao_usuario: descricao,
          user_id: user.id,
          status,
          links: linksValidos,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Chamado criado com sucesso",
      });

      navigate(`/chamados/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Erro ao criar chamado",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate("/")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Novo Chamado</CardTitle>
          <CardDescription>
            Preencha as informações abaixo para criar um novo chamado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                placeholder="Digite o título do chamado"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroChamado">ID do Chamado (Opcional)</Label>
              <Input
                id="numeroChamado"
                placeholder="Ex: CH-2025-001"
                value={numeroChamado}
                onChange={(e) => setNumeroChamado(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Deixe em branco para gerar automaticamente
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nivel">Nível *</Label>
                <Select value={nivel} onValueChange={setNivel} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Nível 1 - Baixo</SelectItem>
                    <SelectItem value="2">Nível 2 - Médio</SelectItem>
                    <SelectItem value="3">Nível 3 - Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estruturante">Estruturante *</Label>
                <Select value={estruturante} onValueChange={setEstruturante} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {estruturantes.map((est) => (
                      <SelectItem key={est} value={est}>
                        {est}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={status} onValueChange={setStatus} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOpcoes.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva detalhadamente o problema ou solicitação"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={6}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Links (Opcional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={adicionarLink}
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Link
                </Button>
              </div>

              {links.map((link, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Nome do Link"
                      value={link.nome}
                      onChange={(e) => atualizarLink(index, "nome", e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="https://exemplo.com"
                      value={link.url}
                      onChange={(e) => atualizarLink(index, "url", e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removerLink(index)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Chamado
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NovoChamado;
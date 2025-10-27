import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Send, User, ExternalLink, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Link = {
  nome: string;
  url: string;
};

type Chamado = {
  id: string;
  numero_chamado: string | null;
  titulo: string;
  status: string;
  nivel: number;
  estruturante: string;
  descricao_usuario: string;
  data_criacao: string;
  data_encaminhamento: string | null;
  data_encerramento: string | null;
  nivel_encaminhado: number | null;
  updated_at: string;
  links: Link[];
};

type Resposta = {
  id: string;
  conteudo: string;
  tipo: string;
  data_criacao: string;
  user_id: string;
};

const DetalhesChamado = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [novaResposta, setNovaResposta] = useState("");
  const [tipoResposta, setTipoResposta] = useState<string>("usuario");
  const [status, setStatus] = useState("");
  const [statusOpcoes, setStatusOpcoes] = useState<string[]>([]);
  const [nivel, setNivel] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previousStatus, setPreviousStatus] = useState("");
  const [previousNivel, setPreviousNivel] = useState("");
  const [isEditingChamado, setIsEditingChamado] = useState(false);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescricao, setEditDescricao] = useState("");

  useEffect(() => {
    if (id) {
      fetchChamado();
      fetchRespostas();
      fetchStatusOpcoes();
    }
  }, [id]);

  const fetchStatusOpcoes = async () => {
    try {
      const { data, error } = await supabase
        .from("status_opcoes")
        .select("nome")
        .order("nome");

      if (error) throw error;
      setStatusOpcoes(data?.map(s => s.nome) || []);
    } catch (error: any) {
      console.error("Erro ao carregar status:", error);
    }
  };

  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (chamado && (status !== chamado.status || nivel !== chamado.nivel.toString())) {
        handleAutoSave();
      }
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [status, nivel]);

  const fetchChamado = async () => {
    try {
      const { data, error } = await supabase
        .from("chamados")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setChamado({
        ...data,
        links: (data.links as any) || []
      });
      setStatus(data.status);
      setNivel(data.nivel.toString());
      setPreviousStatus(data.status);
      setPreviousNivel(data.nivel.toString());
      setEditTitulo(data.titulo);
      setEditDescricao(data.descricao_usuario);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar chamado",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRespostas = async () => {
    try {
      const { data, error } = await supabase
        .from("respostas")
        .select("*")
        .eq("chamado_id", id)
        .order("data_criacao", { ascending: true });

      if (error) throw error;

      setRespostas(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar respostas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAutoSave = async () => {
    if (!chamado) return;

    try {
      const updateData: any = {
        status,
        nivel: parseInt(nivel),
      };

      // Registrar data de encerramento quando status muda para "Fechado"
      if (status.toLowerCase() === "fechado" && previousStatus.toLowerCase() !== "fechado") {
        updateData.data_encerramento = new Date().toISOString();
      }

      // Registrar data de encaminhamento quando nível aumenta
      if (parseInt(nivel) > parseInt(previousNivel)) {
        updateData.data_encaminhamento = new Date().toISOString();
        updateData.nivel_encaminhado = parseInt(nivel);
      }

      const { error } = await supabase
        .from("chamados")
        .update(updateData)
        .eq("id", chamado.id);

      if (error) throw error;

      setPreviousStatus(status);
      setPreviousNivel(nivel);
    } catch (error: any) {
      console.error("Erro ao salvar automaticamente:", error);
    }
  };

  const handleEnviarResposta = async () => {
    if (!novaResposta.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma resposta",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("respostas")
        .insert({
          chamado_id: id,
          user_id: user.id,
          conteudo: novaResposta,
          tipo: tipoResposta,
        });

      if (error) throw error;

      toast({
        title: "Resposta enviada!",
        description: "A resposta foi adicionada ao chamado",
      });

      setNovaResposta("");
      setTipoResposta("usuario");
      fetchRespostas();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar resposta",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSalvarEdicaoChamado = async () => {
    if (!chamado || !editTitulo.trim() || !editDescricao.trim()) {
      toast({
        title: "Erro",
        description: "Título e descrição são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("chamados")
        .update({
          titulo: editTitulo.trim(),
          descricao_usuario: editDescricao.trim(),
        })
        .eq("id", chamado.id);

      if (error) throw error;

      toast({
        title: "Chamado atualizado!",
        description: "As alterações foram salvas",
      });

      setIsEditingChamado(false);
      fetchChamado();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar chamado",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExcluirChamado = async () => {
    if (!chamado) return;
    if (!confirm("Tem certeza que deseja excluir este chamado? Esta ação não pode ser desfeita.")) return;

    try {
      const { error } = await supabase
        .from("chamados")
        .delete()
        .eq("id", chamado.id);

      if (error) throw error;

      toast({
        title: "Chamado excluído!",
        description: "O chamado foi removido com sucesso",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Erro ao excluir chamado",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading || !chamado) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate("/")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Chamados
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {chamado.numero_chamado || `#${chamado.id.slice(0, 8)}`}
                </Badge>
                {isEditingChamado ? (
                  <Input
                    value={editTitulo}
                    onChange={(e) => setEditTitulo(e.target.value)}
                    className="text-2xl font-bold"
                  />
                ) : (
                  <CardTitle className="text-2xl">{chamado.titulo}</CardTitle>
                )}
              </div>
              <CardDescription>
                Criado em {formatDate(chamado.data_criacao)}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {isEditingChamado ? (
                <>
                  <Button size="sm" onClick={handleSalvarEdicaoChamado}>
                    Salvar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditingChamado(false);
                      setEditTitulo(chamado.titulo);
                      setEditDescricao(chamado.descricao_usuario);
                    }}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsEditingChamado(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleExcluirChamado}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
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
            <div className="space-y-2">
              <Label>Nível</Label>
              <Select value={nivel} onValueChange={setNivel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Nível 1 - Baixo</SelectItem>
                  <SelectItem value="2">Nível 2 - Médio</SelectItem>
                  <SelectItem value="3">Nível 3 - Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estruturante</Label>
            <Input value={chamado.estruturante} disabled />
          </div>

          <div className="space-y-2">
            <Label>Descrição Original</Label>
            {isEditingChamado ? (
              <Textarea
                value={editDescricao}
                onChange={(e) => setEditDescricao(e.target.value)}
                rows={4}
              />
            ) : (
              <Textarea
                value={chamado.descricao_usuario}
                disabled
                rows={4}
                className="resize-none"
              />
            )}
          </div>

          {chamado.links && chamado.links.length > 0 && (
            <div className="space-y-2">
              <Label>Links Relacionados</Label>
              <div className="space-y-2">
                {chamado.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{link.nome}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new URL(link.url).hostname}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Histórico de Respostas</h3>
            
            {respostas.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma resposta ainda. Seja o primeiro a responder!
              </p>
            ) : (
              <div className="space-y-4">
                {respostas.map((resposta) => (
                  <Card key={resposta.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {resposta.tipo === "usuario" ? "Usuário" : 
                           resposta.tipo === "central" ? "Central" : "Atendente"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          · {formatDate(resposta.data_criacao)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{resposta.conteudo}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Nova Resposta</Label>
            <div className="space-y-2">
              <Label>Tipo de Resposta</Label>
              <Select value={tipoResposta} onValueChange={setTipoResposta}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usuario">Resposta do Usuário</SelectItem>
                  <SelectItem value="central">Resposta da Central</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Digite sua resposta aqui..."
              value={novaResposta}
              onChange={(e) => setNovaResposta(e.target.value)}
              rows={4}
            />
            <Button onClick={handleEnviarResposta} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar Resposta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetalhesChamado;
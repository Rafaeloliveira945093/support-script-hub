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
import { ArrowLeft, Loader2, Send, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Chamado = {
  id: string;
  titulo: string;
  status: string;
  nivel: number;
  estruturante: string;
  descricao_usuario: string;
  data_criacao: string;
  updated_at: string;
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
  const [status, setStatus] = useState("");
  const [nivel, setNivel] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchChamado();
      fetchRespostas();
    }
  }, [id]);

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

      setChamado(data);
      setStatus(data.status);
      setNivel(data.nivel.toString());
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
      const { error } = await supabase
        .from("chamados")
        .update({
          status,
          nivel: parseInt(nivel),
        })
        .eq("id", chamado.id);

      if (error) throw error;
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
          tipo: "atendente",
        });

      if (error) throw error;

      toast({
        title: "Resposta enviada!",
        description: "A resposta foi adicionada ao chamado",
      });

      setNovaResposta("");
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
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  #{chamado.id.slice(0, 8)}
                </Badge>
                <CardTitle className="text-2xl">{chamado.titulo}</CardTitle>
              </div>
              <CardDescription>
                Criado em {formatDate(chamado.data_criacao)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Input
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Ex: Aberto, Em andamento, Fechado"
              />
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
            <Textarea
              value={chamado.descricao_usuario}
              disabled
              rows={4}
              className="resize-none"
            />
          </div>

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
                          {resposta.tipo === "usuario" ? "Usuário" : "Atendente"}
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
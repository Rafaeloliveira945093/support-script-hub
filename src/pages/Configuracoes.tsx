import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Estruturante = {
  id: string;
  nome: string;
};

type StatusOpcao = {
  id: string;
  nome: string;
  cor: string;
};

const Configuracoes = () => {
  const [estruturantes, setEstruturantes] = useState<Estruturante[]>([]);
  const [statusOpcoes, setStatusOpcoes] = useState<StatusOpcao[]>([]);
  const [novoEstruturante, setNovoEstruturante] = useState("");
  const [novoStatus, setNovoStatus] = useState("");
  const [novaCorStatus, setNovaCorStatus] = useState("#9ca3af");
  const [editandoEstruturante, setEditandoEstruturante] = useState<string | null>(null);
  const [editandoStatus, setEditandoStatus] = useState<string | null>(null);
  const [valorEditEstruturante, setValorEditEstruturante] = useState("");
  const [valorEditStatus, setValorEditStatus] = useState("");
  const [corEditStatus, setCorEditStatus] = useState("#9ca3af");
  const { toast } = useToast();

  useEffect(() => {
    fetchEstruturantes();
    fetchStatusOpcoes();
  }, []);

  const fetchEstruturantes = async () => {
    try {
      const { data, error } = await supabase
        .from("estruturantes")
        .select("*")
        .order("nome");

      if (error) throw error;
      setEstruturantes(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar estruturantes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchStatusOpcoes = async () => {
    try {
      const { data, error } = await supabase
        .from("status_opcoes")
        .select("*")
        .order("nome");

      if (error) throw error;
      setStatusOpcoes(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAdicionarEstruturante = async () => {
    if (!novoEstruturante.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para o estruturante",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("estruturantes")
        .insert({ nome: novoEstruturante.trim(), user_id: user.id });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Estruturante adicionado",
      });

      setNovoEstruturante("");
      fetchEstruturantes();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar estruturante",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAdicionarStatus = async () => {
    if (!novoStatus.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para o status",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("status_opcoes")
        .insert({ nome: novoStatus.trim(), cor: novaCorStatus, user_id: user.id });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Status adicionado",
      });

      setNovoStatus("");
      setNovaCorStatus("#9ca3af");
      fetchStatusOpcoes();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditarEstruturante = async (id: string) => {
    if (!valorEditEstruturante.trim()) return;

    try {
      const { error } = await supabase
        .from("estruturantes")
        .update({ nome: valorEditEstruturante.trim() })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Estruturante atualizado",
      });

      setEditandoEstruturante(null);
      setValorEditEstruturante("");
      fetchEstruturantes();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditarStatus = async (id: string) => {
    if (!valorEditStatus.trim()) return;

    try {
      const { error } = await supabase
        .from("status_opcoes")
        .update({ nome: valorEditStatus.trim(), cor: corEditStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Status atualizado",
      });

      setEditandoStatus(null);
      setValorEditStatus("");
      setCorEditStatus("#9ca3af");
      fetchStatusOpcoes();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExcluirEstruturante = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este estruturante?")) return;

    try {
      const { error } = await supabase
        .from("estruturantes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Estruturante excluído",
      });

      fetchEstruturantes();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExcluirStatus = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este status?")) return;

    try {
      const { error } = await supabase
        .from("status_opcoes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Status excluído",
      });

      fetchStatusOpcoes();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-8 w-8" />
        <div>
          <h2 className="text-3xl font-bold">Configurações</h2>
          <p className="text-muted-foreground">
            Gerencie estruturantes e status do sistema
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Estruturantes */}
        <Card>
          <CardHeader>
            <CardTitle>Estruturantes</CardTitle>
            <CardDescription>
              Gerencie as áreas/departamentos do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nome do estruturante"
                value={novoEstruturante}
                onChange={(e) => setNovoEstruturante(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAdicionarEstruturante()}
              />
              <Button onClick={handleAdicionarEstruturante}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {estruturantes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum estruturante cadastrado
                </p>
              ) : (
                estruturantes.map((est) => (
                  <div
                    key={est.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    {editandoEstruturante === est.id ? (
                      <div className="flex gap-2 flex-1">
                        <Input
                          value={valorEditEstruturante}
                          onChange={(e) => setValorEditEstruturante(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleEditarEstruturante(est.id)
                          }
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleEditarEstruturante(est.id)}
                        >
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditandoEstruturante(null);
                            setValorEditEstruturante("");
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Badge variant="secondary">{est.nome}</Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditandoEstruturante(est.id);
                              setValorEditEstruturante(est.nome);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExcluirEstruturante(est.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>
              Gerencie os status dos chamados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Nome do status"
                value={novoStatus}
                onChange={(e) => setNovoStatus(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAdicionarStatus()}
                className="flex-1"
              />
              <div className="flex items-center gap-2 shrink-0">
                <label className="text-sm font-medium whitespace-nowrap">Cor:</label>
                <input
                  type="color"
                  value={novaCorStatus}
                  onChange={(e) => setNovaCorStatus(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border"
                />
              </div>
              <Button onClick={handleAdicionarStatus} className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {statusOpcoes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum status cadastrado
                </p>
              ) : (
                statusOpcoes.map((status) => (
                  <div
                    key={status.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    {editandoStatus === status.id ? (
                      <div className="flex gap-2 flex-1 items-center">
                        <Input
                          value={valorEditStatus}
                          onChange={(e) => setValorEditStatus(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleEditarStatus(status.id)
                          }
                          autoFocus
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="text-sm font-medium whitespace-nowrap">Cor:</label>
                          <input
                            type="color"
                            value={corEditStatus}
                            onChange={(e) => setCorEditStatus(e.target.value)}
                            className="h-10 w-14 cursor-pointer rounded border"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleEditarStatus(status.id)}
                        >
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditandoStatus(null);
                            setValorEditStatus("");
                            setCorEditStatus("#9ca3af");
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Badge 
                          variant="secondary" 
                          style={{ backgroundColor: status.cor, color: '#fff' }}
                        >
                          {status.nome}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditandoStatus(status.id);
                              setValorEditStatus(status.nome);
                              setCorEditStatus(status.cor);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExcluirStatus(status.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Configuracoes;
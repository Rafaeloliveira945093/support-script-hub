import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Clock,
  AlertCircle,
  Search,
  X,
  MessageSquare,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isPrazoExpirado } from "@/lib/dateUtils";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type Chamado = {
  id: string;
  numero_chamado: string | null;
  titulo: string;
  status: string;
  nivel: number;
  estruturante: string;
  data_criacao: string;
  data_prazo: string | null;
  user_id: string;
  anotacoes_internas?: string;
};

type StatusOpcao = {
  nome: string;
  cor: string;
};

const Chamados = () => {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [filteredChamados, setFilteredChamados] = useState<Chamado[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [estruturantes, setEstruturantes] = useState<string[]>([]);
  const [statusOpcoes, setStatusOpcoes] = useState<StatusOpcao[]>([]);
  const [filtroNivel, setFiltroNivel] = useState<string>("all");
  const [filtroEstruturante, setFiltroEstruturante] = useState<string>("all");
  const [filtroStatus, setFiltroStatus] = useState<string[]>([]);
  const [filtroDataInicio, setFiltroDataInicio] = useState<Date | undefined>(
    undefined,
  );
  const [filtroDataFim, setFiltroDataFim] = useState<Date | undefined>(
    undefined,
  );
  // Carregar filtros persistidos ao abrir a página
  useEffect(() => {
    const saved = localStorage.getItem("filtrosChamados");
    if (saved) {
      const f = JSON.parse(saved);

      if (f.searchTerm) setSearchTerm(f.searchTerm);
      if (f.filtroNivel) setFiltroNivel(f.filtroNivel);
      if (f.filtroEstruturante) setFiltroEstruturante(f.filtroEstruturante);
      if (f.filtroStatus) setFiltroStatus(f.filtroStatus);
      if (f.filtroDataInicio) setFiltroDataInicio(new Date(f.filtroDataInicio));
      if (f.filtroDataFim) setFiltroDataFim(new Date(f.filtroDataFim));
    }
  }, []);

  const [selectedChamadoId, setSelectedChamadoId] = useState<string | null>(
    null,
  );
  const [anotacoesDialog, setAnotacoesDialog] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchChamados();
    fetchEstruturantes();
    fetchStatusOpcoes();

    // Verificar prazos expirados a cada minuto
    const interval = setInterval(checkPrazosExpirados, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = chamados;

    // Aplicar busca por texto
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (chamado) =>
          chamado.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (chamado.numero_chamado &&
            chamado.numero_chamado
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          chamado.titulo.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Aplicar filtro de nível
    if (filtroNivel !== "all") {
      filtered = filtered.filter(
        (chamado) => chamado.nivel === parseInt(filtroNivel),
      );
    }

    // Aplicar filtro de estruturante
    if (filtroEstruturante !== "all") {
      filtered = filtered.filter(
        (chamado) => chamado.estruturante === filtroEstruturante,
      );
    }

    // Aplicar filtro de status (múltiplos)
    if (filtroStatus.length > 0) {
      filtered = filtered.filter((chamado) =>
        filtroStatus.includes(chamado.status),
      );
    }

    // Aplicar filtro de data (baseado em data_criacao)
    if (filtroDataInicio) {
      filtered = filtered.filter((chamado) => {
        const dataCriacao = new Date(chamado.data_criacao);
        return dataCriacao >= filtroDataInicio;
      });
    }

    if (filtroDataFim) {
      filtered = filtered.filter((chamado) => {
        const dataCriacao = new Date(chamado.data_criacao);
        const fimDoDia = new Date(filtroDataFim);
        fimDoDia.setHours(23, 59, 59, 999);
        return dataCriacao <= fimDoDia;
      });
    }

    setFilteredChamados(filtered);
  }, [
    searchTerm,
    chamados,
    filtroNivel,
    filtroEstruturante,
    filtroStatus,
    filtroDataInicio,
    filtroDataFim,
  ]);

  // Salvar filtros sempre que algum filtro mudar
  useEffect(() => {
    localStorage.setItem(
      "filtrosChamados",
      JSON.stringify({
        searchTerm,
        filtroNivel,
        filtroEstruturante,
        filtroStatus,
        filtroDataInicio,
        filtroDataFim,
      }),
    );
  }, [
    searchTerm,
    filtroNivel,
    filtroEstruturante,
    filtroStatus,
    filtroDataInicio,
    filtroDataFim,
  ]);

  const fetchChamados = async () => {
    try {
      const { data, error } = await supabase
        .from("chamados")
        .select(
          "id, numero_chamado, titulo, status, data_criacao, nivel, estruturante, data_prazo, user_id, anotacoes_internas, last_edited_at",
        )
        .order("last_edited_at", { ascending: false, nullsFirst: false })
        .order("data_criacao", { ascending: false });

      if (error) throw error;

      setChamados(data || []);
      setFilteredChamados(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar chamados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEstruturantes = async () => {
    try {
      const { data, error } = await supabase
        .from("estruturantes")
        .select("nome")
        .order("nome");

      if (error) throw error;

      const nomes = data?.map((item) => item.nome) || [];
      setEstruturantes(nomes);
    } catch (error: any) {
      console.error("Erro ao carregar estruturantes:", error);
    }
  };

  const fetchStatusOpcoes = async () => {
    try {
      const { data, error } = await supabase
        .from("status_opcoes")
        .select("nome, cor")
        .order("nome");

      if (error) throw error;

      setStatusOpcoes(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar status:", error);
    }
  };

  const checkPrazosExpirados = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar chamados com prazo expirado que ainda não foram notificados
      const { data: chamadosExpirados, error } = await supabase
        .from("chamados")
        .select("id, numero_chamado, titulo, data_prazo, user_id")
        .eq("user_id", user.id)
        .eq("status", "aguardando_devolutiva")
        .not("data_prazo", "is", null);

      if (error) throw error;

      // Criar notificações para chamados com prazo expirado
      for (const chamado of chamadosExpirados || []) {
        if (isPrazoExpirado(chamado.data_prazo)) {
          // Verificar se já existe notificação
          const { data: notifExistente } = await supabase
            .from("notificacoes")
            .select("id")
            .eq("chamado_id", chamado.id)
            .eq("user_id", user.id)
            .single();

          if (!notifExistente) {
            await supabase.from("notificacoes").insert({
              user_id: chamado.user_id,
              chamado_id: chamado.id,
              mensagem: `O prazo de 72h úteis do chamado "${chamado.titulo}" expirou. Por favor, atualize o status.`,
            });
          }
        }
      }
    } catch (error: any) {
      console.error("Erro ao verificar prazos:", error);
    }
  };

  const limparFiltros = () => {
    setFiltroNivel("all");
    setFiltroEstruturante("all");
    setFiltroStatus([]);
    setFiltroDataInicio(undefined);
    setFiltroDataFim(undefined);
    setSearchTerm("");

    // limpar persistência
    localStorage.removeItem("filtrosChamados");
  };

  const hasActiveFilters =
    filtroNivel !== "all" ||
    filtroEstruturante !== "all" ||
    filtroStatus.length > 0 ||
    searchTerm !== "" ||
    filtroDataInicio ||
    filtroDataFim;

  const getNivelColor = (nivel: number) => {
    switch (nivel) {
      case 1:
        return "bg-info text-info-foreground";
      case 2:
        return "bg-warning text-warning-foreground";
      case 3:
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
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

  const getStatusColor = (statusNome: string, dataPrazo: string | null) => {
    // Se prazo expirado, retornar vermelho
    if (dataPrazo && isPrazoExpirado(dataPrazo)) {
      return "#ef4444"; // red-500
    }
    const statusOpcao = statusOpcoes.find((s) => s.nome === statusNome);
    return statusOpcao?.cor || "#9ca3af";
  };

  const handleOpenAnotacoes = async (
    e: React.MouseEvent,
    chamadoId: string,
  ) => {
    e.stopPropagation();
    const chamado = chamados.find((c) => c.id === chamadoId);
    if (chamado?.anotacoes_internas) {
      setAnotacoesDialog(chamado.anotacoes_internas);
      setSelectedChamadoId(chamadoId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando chamados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Chamados</h2>
          <p className="text-muted-foreground">
            Gerencie todos os seus chamados de atendimento
          </p>
        </div>
        <Button onClick={() => navigate("/chamados/novo")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Chamado
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID ou Título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filtroNivel} onValueChange={setFiltroNivel}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Níveis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Níveis</SelectItem>
                <SelectItem value="1">Nível 1</SelectItem>
                <SelectItem value="2">Nível 2</SelectItem>
                <SelectItem value="3">Nível 3</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtroEstruturante}
              onValueChange={setFiltroEstruturante}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os Estruturantes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Estruturantes</SelectItem>
                {estruturantes.map((estruturante) => (
                  <SelectItem key={estruturante} value={estruturante}>
                    {estruturante}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !filtroDataInicio &&
                      !filtroDataFim &&
                      "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filtroDataInicio ? (
                    filtroDataFim ? (
                      <>
                        {format(filtroDataInicio, "dd/MM/yy")} -{" "}
                        {format(filtroDataFim, "dd/MM/yy")}
                      </>
                    ) : (
                      format(filtroDataInicio, "dd/MM/yy")
                    )
                  ) : (
                    <span>Período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 space-y-2">
                  <div>
                    <Label className="text-xs">Data Início</Label>
                    <Calendar
                      mode="single"
                      selected={filtroDataInicio}
                      onSelect={setFiltroDataInicio}
                      locale={ptBR}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Data Fim</Label>
                    <Calendar
                      mode="single"
                      selected={filtroDataFim}
                      onSelect={setFiltroDataFim}
                      locale={ptBR}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Filtro de Status com múltipla seleção */}
          <div className="mt-4 space-y-2">
            <Label className="text-sm">Status (múltipla seleção)</Label>
            <div className="flex flex-wrap gap-4">
              {statusOpcoes.map((status) => (
                <div key={status.nome} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status.nome}`}
                    checked={filtroStatus.includes(status.nome)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFiltroStatus([...filtroStatus, status.nome]);
                      } else {
                        setFiltroStatus(
                          filtroStatus.filter((s) => s !== status.nome),
                        );
                      }
                    }}
                  />
                  <label
                    htmlFor={`status-${status.nome}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {status.nome}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={limparFiltros}>
                <X className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {filteredChamados.length === 0 && chamados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Nenhum chamado encontrado
            </p>
            <p className="text-muted-foreground mb-4">
              Comece criando seu primeiro chamado
            </p>
            <Button onClick={() => navigate("/chamados/novo")}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Chamado
            </Button>
          </CardContent>
        </Card>
      ) : filteredChamados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Nenhum chamado encontrado
            </p>
            <p className="text-muted-foreground">
              Tente buscar com outros termos
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredChamados.map((chamado) => (
            <Card
              key={chamado.id}
              className="hover:shadow-md transition-shadow cursor-pointer border-l-4"
              onClick={() => navigate(`/chamados/${chamado.id}`)}
              style={{
                borderLeftColor: getStatusColor(
                  chamado.status,
                  chamado.data_prazo,
                ),
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {chamado.numero_chamado || `#${chamado.id.slice(0, 8)}`}
                      </Badge>
                      <Badge className={getNivelColor(chamado.nivel)}>
                        Nível {chamado.nivel}
                      </Badge>
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: getStatusColor(
                            chamado.status,
                            chamado.data_prazo,
                          ),
                          color: "#fff",
                        }}
                      >
                        {chamado.status}
                        {chamado.data_prazo &&
                          isPrazoExpirado(chamado.data_prazo) &&
                          " - PRAZO EXPIRADO"}
                      </Badge>
                      {chamado.anotacoes_internas &&
                        chamado.anotacoes_internas.trim() !== "" && (
                          <MessageSquare
                            className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                            onClick={(e) => handleOpenAnotacoes(e, chamado.id)}
                          />
                        )}
                    </div>
                    <CardTitle className="text-xl">{chamado.titulo}</CardTitle>
                    <CardDescription className="mt-2">
                      {chamado.estruturante}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  Criado em {formatDate(chamado.data_criacao)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!selectedChamadoId}
        onOpenChange={(open) => !open && setSelectedChamadoId(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Anotações do Chamado
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: anotacoesDialog }}
            />
          </ScrollArea>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setSelectedChamadoId(null)}
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                setSelectedChamadoId(null);
                navigate(`/chamados/${selectedChamadoId}`);
              }}
            >
              Ver Completo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chamados;

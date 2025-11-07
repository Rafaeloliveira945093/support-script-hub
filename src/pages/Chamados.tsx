import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, AlertCircle, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Chamado = {
  id: string;
  numero_chamado: string | null;
  titulo: string;
  status: string;
  nivel: number;
  estruturante: string;
  data_criacao: string;
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
  const [filtroStatus, setFiltroStatus] = useState<string>("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchChamados();
    fetchEstruturantes();
    fetchStatusOpcoes();
  }, []);

  useEffect(() => {
    let filtered = chamados;

    // Aplicar busca por texto
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((chamado) =>
        chamado.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (chamado.numero_chamado && chamado.numero_chamado.toLowerCase().includes(searchTerm.toLowerCase())) ||
        chamado.titulo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtro de nível
    if (filtroNivel !== "all") {
      filtered = filtered.filter((chamado) => chamado.nivel === parseInt(filtroNivel));
    }

    // Aplicar filtro de estruturante
    if (filtroEstruturante !== "all") {
      filtered = filtered.filter((chamado) => chamado.estruturante === filtroEstruturante);
    }

    // Aplicar filtro de status
    if (filtroStatus !== "all") {
      filtered = filtered.filter((chamado) => chamado.status === filtroStatus);
    }

    setFilteredChamados(filtered);
  }, [searchTerm, chamados, filtroNivel, filtroEstruturante, filtroStatus]);

  const fetchChamados = async () => {
    try {
      const { data, error } = await supabase
        .from("chamados")
        .select("*")
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

  const limparFiltros = () => {
    setFiltroNivel("all");
    setFiltroEstruturante("all");
    setFiltroStatus("all");
    setSearchTerm("");
  };

  const hasActiveFilters = filtroNivel !== "all" || filtroEstruturante !== "all" || filtroStatus !== "all" || searchTerm !== "";

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

  const getStatusColor = (statusNome: string) => {
    const statusOpcao = statusOpcoes.find(s => s.nome === statusNome);
    return statusOpcao?.cor || "#9ca3af";
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
          <div className="grid gap-4 md:grid-cols-4">
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

            <Select value={filtroEstruturante} onValueChange={setFiltroEstruturante}>
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

            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {statusOpcoes.map((status) => (
                  <SelectItem key={status.nome} value={status.nome}>
                    {status.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <p className="text-lg font-medium mb-2">Nenhum chamado encontrado</p>
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
            <p className="text-lg font-medium mb-2">Nenhum chamado encontrado</p>
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
              style={{ borderLeftColor: getStatusColor(chamado.status) }}
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
                        style={{ backgroundColor: getStatusColor(chamado.status), color: '#fff' }}
                      >
                        {chamado.status}
                      </Badge>
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
    </div>
  );
};

export default Chamados;
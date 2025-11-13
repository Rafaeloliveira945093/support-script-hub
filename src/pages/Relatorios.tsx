import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, BarChart3, FileText, AlertTriangle, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Stats = {
  total: number;
  emAndamento: number;
  fechadosNoPeriodo: number;
  encaminhadosN3NoPeriodo: number;
  porStatus: Record<string, number>;
  porEstruturante: Record<string, number>;
  porNivel: Record<number, number>;
};

const Relatorios = () => {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    emAndamento: 0,
    fechadosNoPeriodo: 0,
    encaminhadosN3NoPeriodo: 0,
    porStatus: {},
    porEstruturante: {},
    porNivel: {},
  });
  const [totalScripts, setTotalScripts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
    fetchScriptsCount();
  }, [startDate, endDate]);

  const fetchScriptsCount = async () => {
    try {
      const { data, error } = await supabase
        .from("scripts")
        .select("id");

      if (error) throw error;
      setTotalScripts(data?.length || 0);
    } catch (error: any) {
      console.error("Erro ao carregar scripts:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Query base para todos os chamados do usuário
      const { data: todosChamados, error: todosError } = await supabase
        .from("chamados")
        .select("*")
        .eq("user_id", user.id);

      if (todosError) throw todosError;

      // Contar "em andamento" independente de data (status atual)
      // Agrupa status que indicam andamento: Em_andamento, Aguardando_devolutiva, Aguardando_ministerio, planner
      const statusEmAndamento = [
        "Em_andamento", 
        "Aguardando_devolutiva", 
        "Aguardando_ministerio", 
        "planner"
      ];
      const emAndamento = todosChamados?.filter(
        c => statusEmAndamento.includes(c.status)
      ).length || 0;

      // Query para chamados criados no período (para estatísticas gerais)
      let query = supabase
        .from("chamados")
        .select("*")
        .eq("user_id", user.id);

      if (startDate) {
        query = query.gte("data_criacao", startDate.toISOString());
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("data_criacao", endOfDay.toISOString());
      }

      const { data: chamados, error } = await query;
      if (error) throw error;

      // Contar fechados no período (por data_encerramento)
      let fechadosQuery = supabase
        .from("chamados")
        .select("*")
        .eq("user_id", user.id)
        .not("data_encerramento", "is", null);

      if (startDate) {
        fechadosQuery = fechadosQuery.gte("data_encerramento", startDate.toISOString());
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        fechadosQuery = fechadosQuery.lte("data_encerramento", endOfDay.toISOString());
      }

      const { data: fechados, error: fechadosError } = await fechadosQuery;
      if (fechadosError) throw fechadosError;

      // Contar encaminhados para N3 no período (por data_encaminhamento e nivel_encaminhado = 3)
      let encaminhadosQuery = supabase
        .from("chamados")
        .select("*")
        .eq("user_id", user.id)
        .eq("nivel_encaminhado", 3)
        .not("data_encaminhamento", "is", null);

      if (startDate) {
        encaminhadosQuery = encaminhadosQuery.gte("data_encaminhamento", startDate.toISOString());
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        encaminhadosQuery = encaminhadosQuery.lte("data_encaminhamento", endOfDay.toISOString());
      }

      const { data: encaminhados, error: encaminhadosError } = await encaminhadosQuery;
      if (encaminhadosError) throw encaminhadosError;

      // Estatísticas gerais baseadas em chamados criados no período
      const porStatus: Record<string, number> = {};
      const porEstruturante: Record<string, number> = {};
      const porNivel: Record<number, number> = { 1: 0, 2: 0, 3: 0 };

      chamados?.forEach((chamado) => {
        porStatus[chamado.status] = (porStatus[chamado.status] || 0) + 1;
        porEstruturante[chamado.estruturante] = (porEstruturante[chamado.estruturante] || 0) + 1;
        porNivel[chamado.nivel] = (porNivel[chamado.nivel] || 0) + 1;
      });

      setStats({
        total: chamados?.length || 0,
        emAndamento,
        fechadosNoPeriodo: fechados?.length || 0,
        encaminhadosN3NoPeriodo: encaminhados?.length || 0,
        porStatus,
        porEstruturante,
        porNivel,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar estatísticas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportar = async () => {
    try {
      const { data: chamados, error: chamadosError } = await supabase
        .from("chamados")
        .select("*")
        .order("data_criacao", { ascending: false });

      if (chamadosError) throw chamadosError;

      const { data: respostas, error: respostasError } = await supabase
        .from("respostas")
        .select("*")
        .order("data_criacao", { ascending: true });

      if (respostasError) throw respostasError;

      const dadosExportacao = chamados?.map((chamado) => {
        const respostasDoChamado = respostas?.filter(r => r.chamado_id === chamado.id) || [];
        const historicoRespostas = respostasDoChamado
          .map(r => `[${new Date(r.data_criacao).toLocaleString()}] ${r.tipo}: ${r.conteudo}`)
          .join("\n\n");

        return {
          ID: chamado.numero_chamado || chamado.id.slice(0, 8),
          Título: chamado.titulo,
          Status: chamado.status,
          Nível: chamado.nivel,
          Estruturante: chamado.estruturante,
          "Descrição": chamado.descricao_usuario,
          "Data de Criação": new Date(chamado.data_criacao).toLocaleString(),
          "Última Atualização": new Date(chamado.updated_at).toLocaleString(),
          "Histórico de Respostas": historicoRespostas || "Sem respostas",
        };
      });

      const ws = XLSX.utils.json_to_sheet(dadosExportacao || []);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Chamados");

      XLSX.writeFile(wb, `relatorio_chamados_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "Exportação concluída!",
        description: "O arquivo foi baixado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao exportar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando relatórios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold">Relatórios</h2>
          <p className="text-muted-foreground">
            Visualize estatísticas e exporte dados dos chamados
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const today = new Date();
                setStartDate(today);
                setEndDate(today);
              }}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const today = new Date();
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                setStartDate(weekStart);
                setEndDate(today);
              }}
            >
              Esta Semana
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const today = new Date();
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                setStartDate(monthStart);
                setEndDate(today);
              }}
            >
              Este Mês
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
              }}
            >
              Limpar
            </Button>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {startDate && endDate
                  ? `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`
                  : startDate
                  ? `A partir de ${format(startDate, "dd/MM/yyyy")}`
                  : endDate
                  ? `Até ${format(endDate, "dd/MM/yyyy")}`
                  : "Selecionar período"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 space-y-2">
                <div className="font-semibold text-sm">Data inicial</div>
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  locale={ptBR}
                  className="pointer-events-auto"
                />
                <div className="font-semibold text-sm mt-4">Data final</div>
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={handleExportar} className="gap-2">
            <FileDown className="h-4 w-4" />
            Exportar para Excel
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Criados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <BarChart3 className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emAndamento}</div>
            <p className="text-xs text-muted-foreground">Status atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fechados</CardTitle>
            <BarChart3 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.fechadosNoPeriodo}</div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Encaminhados N3</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.encaminhadosN3NoPeriodo}</div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Scripts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScripts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nível 1</CardTitle>
            <BarChart3 className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.porNivel[1]}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nível 2</CardTitle>
            <BarChart3 className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.porNivel[2]}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nível 3</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.porNivel[3]}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chamados por Status</CardTitle>
            <CardDescription>Distribuição de chamados por status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.porStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{status}</span>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              ))}
              {Object.keys(stats.porStatus).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum dado disponível
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chamados por Estruturante</CardTitle>
            <CardDescription>Distribuição de chamados por área</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.porEstruturante).map(([estruturante, count]) => (
                <div key={estruturante} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{estruturante}</span>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              ))}
              {Object.keys(stats.porEstruturante).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum dado disponível
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Relatorios;
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, BarChart3, FileText, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

type Stats = {
  total: number;
  porStatus: Record<string, number>;
  porEstruturante: Record<string, number>;
  porNivel: Record<number, number>;
};

const Relatorios = () => {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    porStatus: {},
    porEstruturante: {},
    porNivel: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: chamados, error } = await supabase
        .from("chamados")
        .select("*");

      if (error) throw error;

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
          ID: chamado.id.slice(0, 8),
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Relatórios</h2>
          <p className="text-muted-foreground">
            Visualize estatísticas e exporte dados dos chamados
          </p>
        </div>
        <Button onClick={handleExportar}>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar para Excel
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Chamados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
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
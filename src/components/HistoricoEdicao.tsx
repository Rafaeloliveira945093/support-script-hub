import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Edit, CheckCircle, ArrowUp, MessageSquare, Link, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type LogEntry = {
  id: string;
  acao: string;
  campo_alterado: string | null;
  valor_antigo: string | null;
  valor_novo: string | null;
  created_at: string;
  user_id: string;
};

type HistoricoEdicaoProps = {
  chamadoId: string;
};

export const HistoricoEdicao = ({ chamadoId }: HistoricoEdicaoProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchLogs();
    
    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [chamadoId]);

  const fetchLogs = async () => {
    try {
      const { data: logsData, error: logsError } = await supabase
        .from("chamado_logs")
        .select("*")
        .eq("chamado_id", chamadoId)
        .order("created_at", { ascending: false });

      if (logsError) throw logsError;

      setLogs(logsData || []);

      // Buscar nomes dos usuários
      const userIds = [...new Set(logsData?.map(log => log.user_id) || [])];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nome_completo, email")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const names: Record<string, string> = {};
      profiles?.forEach(profile => {
        names[profile.id] = profile.nome_completo || profile.email || "Usuário";
      });
      setUserNames(names);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (acao: string) => {
    switch (acao) {
      case "status_change":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "escalation":
        return <ArrowUp className="h-4 w-4 text-warning" />;
      case "response_added":
        return <MessageSquare className="h-4 w-4 text-info" />;
      case "link_added":
        return <Link className="h-4 w-4 text-primary" />;
      case "link_removed":
        return <Trash2 className="h-4 w-4 text-destructive" />;
      case "notes_updated":
        return <Edit className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Edit className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionDescription = (log: LogEntry) => {
    const userName = userNames[log.user_id] || "Usuário";
    
    switch (log.acao) {
      case "status_change":
        return `${userName} alterou o status de "${log.valor_antigo}" para "${log.valor_novo}"`;
      case "escalation":
        return `${userName} encaminhou para o nível ${log.valor_novo}`;
      case "response_added":
        return `${userName} adicionou uma resposta`;
      case "link_added":
        return `${userName} adicionou um link`;
      case "link_removed":
        return `${userName} removeu um link`;
      case "notes_updated":
        return `${userName} atualizou as anotações internas`;
      case "created":
        return `${userName} criou o chamado`;
      case "update":
        if (log.campo_alterado) {
          return `${userName} alterou ${log.campo_alterado}${log.valor_antigo && log.valor_novo ? ` de "${log.valor_antigo}" para "${log.valor_novo}"` : ""}`;
        }
        return `${userName} atualizou o chamado`;
      default:
        return `${userName} realizou uma ação`;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Edição
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico de Edição
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma ação registrada ainda
            </p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-3 pb-4 border-b last:border-0">
                  <div className="mt-1">
                    {getActionIcon(log.acao)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{getActionDescription(log)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

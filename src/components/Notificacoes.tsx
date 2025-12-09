import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, RefreshCw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

type Notificacao = {
  id: string;
  chamado_id: string;
  mensagem: string;
  visualizada: boolean;
  created_at: string;
};

export const Notificacoes = () => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckingExpired, setIsCheckingExpired] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchNotificacoes();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('notificacoes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificacoes',
        },
        () => {
          fetchNotificacoes();
        }
      )
      .subscribe();

    // Automatic check for expired tickets every 5 minutes
    const intervalId = setInterval(() => {
      checkExpiredChamados();
    }, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, []);

  const fetchNotificacoes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .eq("user_id", user.id)
        .eq("visualizada", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotificacoes(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar notificações:", error);
    }
  };

  const checkExpiredChamados = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/check-expired-chamados`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao verificar chamados expirados');
      }

      const result = await response.json();
      console.log('Verificação de chamados expirados:', result);

      // Refresh notifications after checking
      fetchNotificacoes();
    } catch (error: any) {
      console.error("Erro ao verificar chamados expirados:", error);
    }
  };

  const handleManualCheck = async () => {
    setIsCheckingExpired(true);
    try {
      await checkExpiredChamados();
      toast({
        title: "Verificação concluída",
        description: "Chamados expirados verificados com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao verificar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCheckingExpired(false);
    }
  };

  const handleVisualizarNotificacao = async (notificacao: Notificacao) => {
    try {
      const { error } = await supabase
        .from("notificacoes")
        .update({ visualizada: true })
        .eq("id", notificacao.id);

      if (error) throw error;

      setIsOpen(false);
      navigate(`/chamados/${notificacao.chamado_id}`);
    } catch (error: any) {
      toast({
        title: "Erro ao marcar notificação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const notNaoVisualizadas = notificacoes.filter(n => !n.visualizada).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notNaoVisualizadas > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {notNaoVisualizadas}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notificações</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleManualCheck}
              disabled={isCheckingExpired}
              title="Verificar chamados expirados"
            >
              <RefreshCw className={`h-4 w-4 ${isCheckingExpired ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {notificacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma notificação pendente
            </p>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {notificacoes.map((notificacao) => (
                  <div
                    key={notificacao.id}
                    className="p-3 border rounded-lg space-y-2 hover:bg-accent transition-colors"
                  >
                    <p className="text-sm">{notificacao.mensagem}</p>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleVisualizarNotificacao(notificacao)}
                    >
                      Ver Chamado
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

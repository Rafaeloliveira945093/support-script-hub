import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Clock, AlertCircle, Search } from "lucide-react";
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

const Chamados = () => {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [filteredChamados, setFilteredChamados] = useState<Chamado[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchChamados();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredChamados(chamados);
    } else {
      const filtered = chamados.filter((chamado) =>
        chamado.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (chamado.numero_chamado && chamado.numero_chamado.toLowerCase().includes(searchTerm.toLowerCase())) ||
        chamado.titulo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredChamados(filtered);
    }
  }, [searchTerm, chamados]);

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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID ou Título..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

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
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/chamados/${chamado.id}`)}
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
                      <Badge variant="secondary">{chamado.status}</Badge>
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
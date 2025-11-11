import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logChamadoChange } from "@/lib/auditLog";

interface Link {
  id: string;
  nome: string;
  url: string;
}

interface LinksManagerProps {
  chamadoId: string;
}

export const LinksManager = ({ chamadoId }: LinksManagerProps) => {
  const [links, setLinks] = useState<Link[]>([]);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLinks();
  }, [chamadoId]);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("chamado_links")
        .select("*")
        .eq("chamado_id", chamadoId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setLinks(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar links:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLink = async () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) {
      toast({
        title: "Erro",
        description: "Nome e URL são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Validar URL
    try {
      new URL(newLinkUrl);
    } catch {
      toast({
        title: "Erro",
        description: "URL inválida. Use formato: https://exemplo.com",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("chamado_links")
        .insert({
          chamado_id: chamadoId,
          nome: newLinkName.trim(),
          url: newLinkUrl.trim(),
          created_by: user.id
        });

      if (error) throw error;

      // Registrar log
      await logChamadoChange({
        chamado_id: chamadoId,
        user_id: user.id,
        acao: "link_added",
        campo_alterado: "links",
        valor_novo: `${newLinkName.trim()} - ${newLinkUrl.trim()}`
      });

      toast({
        title: "Link adicionado!",
        description: "O link foi adicionado com sucesso",
      });

      setNewLinkName("");
      setNewLinkUrl("");
      fetchLinks();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteLink = async (linkId: string, linkName: string) => {
    if (!confirm(`Deseja remover o link "${linkName}"?`)) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("chamado_links")
        .delete()
        .eq("id", linkId);

      if (error) throw error;

      // Registrar log
      await logChamadoChange({
        chamado_id: chamadoId,
        user_id: user.id,
        acao: "link_removed",
        campo_alterado: "links",
        valor_antigo: linkName
      });

      toast({
        title: "Link removido!",
        description: "O link foi removido com sucesso",
      });

      fetchLinks();
    } catch (error: any) {
      toast({
        title: "Erro ao remover link",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label>Links Relacionados</Label>
      
      {/* Lista de links existentes */}
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate">{link.nome}</span>
                <span className="text-xs text-muted-foreground ml-auto shrink-0">
                  {new URL(link.url).hostname}
                </span>
              </a>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteLink(link.id, link.nome)}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Formulário para adicionar novo link */}
      <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground" />
          <Label>Adicionar Novo Link</Label>
        </div>
        <div className="space-y-2">
          <Input
            placeholder="Nome do link"
            value={newLinkName}
            onChange={(e) => setNewLinkName(e.target.value)}
          />
          <Input
            placeholder="https://exemplo.com"
            value={newLinkUrl}
            onChange={(e) => setNewLinkUrl(e.target.value)}
            type="url"
          />
          <Button 
            onClick={handleAddLink} 
            disabled={isAdding}
            size="sm"
            className="w-full"
          >
            {isAdding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Adicionar Link
          </Button>
        </div>
      </div>
    </div>
  );
};

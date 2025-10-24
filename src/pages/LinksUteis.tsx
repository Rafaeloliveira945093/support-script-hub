import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ExternalLink, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Link = {
  id: string;
  nome: string;
  url: string;
  created_at: string;
};

const LinksUteis = () => {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [nome, setNome] = useState("");
  const [url, setUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("links_uteis")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar links",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (link?: Link) => {
    if (link) {
      setEditingLink(link);
      setNome(link.nome);
      setUrl(link.url);
    } else {
      setEditingLink(null);
      setNome("");
      setUrl("");
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLink(null);
    setNome("");
    setUrl("");
  };

  const handleSave = async () => {
    if (!nome.trim() || !url.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (editingLink) {
        const { error } = await supabase
          .from("links_uteis")
          .update({ nome, url })
          .eq("id", editingLink.id);

        if (error) throw error;

        toast({
          title: "Link atualizado",
          description: "Link atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from("links_uteis")
          .insert({ nome, url, user_id: user.id });

        if (error) throw error;

        toast({
          title: "Link adicionado",
          description: "Link adicionado com sucesso",
        });
      }

      handleCloseDialog();
      fetchLinks();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este link?")) return;

    try {
      const { error } = await supabase
        .from("links_uteis")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Link excluído",
        description: "Link excluído com sucesso",
      });

      fetchLinks();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir link",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando links...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Links Úteis</h2>
          <p className="text-muted-foreground">
            Gerencie links úteis para acesso rápido
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Link
        </Button>
      </div>

      {links.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ExternalLink className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum link cadastrado</p>
            <p className="text-muted-foreground mb-4">
              Comece adicionando seu primeiro link útil
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeiro Link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {links.map((link) => (
            <Card key={link.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center gap-2"
                      >
                        {link.nome}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </CardTitle>
                    <CardDescription className="mt-2 break-all">
                      {link.url}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(link)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(link.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLink ? "Editar Link" : "Adicionar Link"}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do link útil
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Link *</Label>
              <Input
                id="nome"
                placeholder="Ex: Documentação API"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL do Link *</Label>
              <Input
                id="url"
                placeholder="https://exemplo.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingLink ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LinksUteis;

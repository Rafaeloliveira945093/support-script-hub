import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Plus, Trash2, Clock, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type Profile = {
  id: string;
  nome_completo: string | null;
  email: string | null;
  cargo: string | null;
  telefone: string | null;
  horario_inicio: string | null;
  horario_fim: string | null;
};

type Pausa = {
  id: string;
  nome: string;
  hora_inicio: string;
  hora_fim: string;
};

export const PerfilUsuario = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pausas, setPausas] = useState<Pausa[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [novaPausa, setNovaPausa] = useState({ nome: "", hora_inicio: "", hora_fim: "" });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
      fetchPausas();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error("Erro ao carregar perfil:", error);
    }
  };

  const fetchPausas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("usuario_pausas")
        .select("*")
        .eq("usuario_id", user.id)
        .order("hora_inicio");

      if (error) throw error;
      setPausas(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar pausas:", error);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nome_completo: profile.nome_completo,
          cargo: profile.cargo,
          telefone: profile.telefone,
          horario_inicio: profile.horario_inicio,
          horario_fim: profile.horario_fim,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPausa = async () => {
    if (!novaPausa.nome || !novaPausa.hora_inicio || !novaPausa.hora_fim) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos da pausa",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("usuario_pausas")
        .insert({
          usuario_id: user.id,
          nome: novaPausa.nome,
          hora_inicio: novaPausa.hora_inicio,
          hora_fim: novaPausa.hora_fim,
        });

      if (error) throw error;

      toast({
        title: "Pausa adicionada!",
        description: "A pausa foi configurada com sucesso",
      });

      setNovaPausa({ nome: "", hora_inicio: "", hora_fim: "" });
      fetchPausas();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar pausa",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeletePausa = async (pausaId: string) => {
    try {
      const { error } = await supabase
        .from("usuario_pausas")
        .delete()
        .eq("id", pausaId);

      if (error) throw error;

      toast({
        title: "Pausa removida!",
        description: "A pausa foi excluída com sucesso",
      });

      fetchPausas();
    } catch (error: any) {
      toast({
        title: "Erro ao remover pausa",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil do Usuário
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      value={profile?.nome_completo || ""}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, nome_completo: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      value={profile?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input
                      id="cargo"
                      value={profile?.cargo || ""}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, cargo: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={profile?.telefone || ""}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, telefone: e.target.value } : null)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horario_inicio">Horário de Início</Label>
                    <Input
                      id="horario_inicio"
                      type="time"
                      value={profile?.horario_inicio || ""}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, horario_inicio: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horario_fim">Horário de Fim</Label>
                    <Input
                      id="horario_fim"
                      type="time"
                      value={profile?.horario_fim || ""}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, horario_fim: e.target.value } : null)}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Salvando..." : "Salvar Perfil"}
                </Button>
              </CardContent>
            </Card>

            {/* Pausas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pausas Configuradas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lista de pausas */}
                <div className="space-y-2">
                  {pausas.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma pausa configurada
                    </p>
                  ) : (
                    pausas.map((pausa) => (
                      <div key={pausa.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{pausa.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {pausa.hora_inicio} - {pausa.hora_fim}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePausa(pausa.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                <Separator />

                {/* Adicionar nova pausa */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Adicionar Nova Pausa</h4>
                  <div className="grid gap-3">
                    <Input
                      placeholder="Nome da pausa (ex: Almoço)"
                      value={novaPausa.nome}
                      onChange={(e) => setNovaPausa(prev => ({ ...prev, nome: e.target.value }))}
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        type="time"
                        placeholder="Hora início"
                        value={novaPausa.hora_inicio}
                        onChange={(e) => setNovaPausa(prev => ({ ...prev, hora_inicio: e.target.value }))}
                      />
                      <Input
                        type="time"
                        placeholder="Hora fim"
                        value={novaPausa.hora_fim}
                        onChange={(e) => setNovaPausa(prev => ({ ...prev, hora_fim: e.target.value }))}
                      />
                    </div>
                    <Button onClick={handleAddPausa} variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Pausa
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

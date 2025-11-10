import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, FileDown, Edit, Trash2, Filter, Search, Copy, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { RichTextEditor } from "@/components/RichTextEditor";

type Script = {
  id: string;
  estruturante: string;
  nivel: number;
  titulo_script: string;
  descricao_script: string;
  conteudo_script: string;
  ultima_atualizacao: string;
};

const Scripts = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [filteredScripts, setFilteredScripts] = useState<Script[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingScript, setViewingScript] = useState<Script | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [filtroEstruturante, setFiltroEstruturante] = useState<string>("all");
  const [filtroNivel, setFiltroNivel] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    titulo_script: "",
    descricao_script: "",
    estruturante: "",
    nivel: "",
    conteudo_script: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchScripts();
  }, []);

  useEffect(() => {
    filterScripts();
  }, [scripts, filtroEstruturante, filtroNivel, searchTerm]);

  const fetchScripts = async () => {
    try {
      const { data, error } = await supabase
        .from("scripts")
        .select("*")
        .order("ultima_atualizacao", { ascending: false });

      if (error) throw error;

      setScripts(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar scripts",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filterScripts = () => {
    let filtered = scripts;

    if (filtroEstruturante && filtroEstruturante !== "all") {
      filtered = filtered.filter(s => s.estruturante === filtroEstruturante);
    }

    if (filtroNivel && filtroNivel !== "all") {
      filtered = filtered.filter(s => s.nivel.toString() === filtroNivel);
    }

    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(s => 
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.titulo_script.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredScripts(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo_script || !formData.estruturante || !formData.nivel || !formData.conteudo_script) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (editingScript) {
        const { error } = await supabase
          .from("scripts")
          .update({
            ...formData,
            nivel: parseInt(formData.nivel),
          })
          .eq("id", editingScript.id);

        if (error) throw error;

        toast({
          title: "Script atualizado!",
          description: "As alterações foram salvas",
        });
      } else {
        const { error } = await supabase
          .from("scripts")
          .insert({
            ...formData,
            nivel: parseInt(formData.nivel),
            user_id: user.id,
          });

        if (error) throw error;

        toast({
          title: "Script criado!",
          description: "O novo script foi adicionado",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchScripts();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar script",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (script: Script) => {
    setEditingScript(script);
    setFormData({
      titulo_script: script.titulo_script,
      descricao_script: script.descricao_script || "",
      estruturante: script.estruturante,
      nivel: script.nivel.toString(),
      conteudo_script: script.conteudo_script,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este script?")) return;

    try {
      const { error } = await supabase
        .from("scripts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Script excluído!",
        description: "O script foi removido com sucesso",
      });

      fetchScripts();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir script",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExportarPDF = () => {
    const doc = new jsPDF();
    let yPosition = 20;

    filteredScripts.forEach((script, index) => {
      if (index > 0) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.text(script.titulo_script, 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Estruturante: ${script.estruturante}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Nível: ${script.nivel}`, 20, yPosition);
      yPosition += 10;

      if (script.descricao_script) {
        doc.setFontSize(12);
        doc.text("Descrição:", 20, yPosition);
        yPosition += 7;
        doc.setFontSize(10);
        const descLines = doc.splitTextToSize(script.descricao_script, 170);
        doc.text(descLines, 20, yPosition);
        yPosition += (descLines.length * 7) + 10;
      }

      doc.setFontSize(12);
      doc.text("Conteúdo:", 20, yPosition);
      yPosition += 7;
      doc.setFontSize(10);
      const contentLines = doc.splitTextToSize(script.conteudo_script, 170);
      doc.text(contentLines, 20, yPosition);
    });

    doc.save(`scripts_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "PDF exportado!",
      description: "O arquivo foi baixado com sucesso",
    });
  };

  const resetForm = () => {
    setFormData({
      titulo_script: "",
      descricao_script: "",
      estruturante: "",
      nivel: "",
      conteudo_script: "",
    });
    setEditingScript(null);
  };

  const handleCopiarScript = (conteudo: string) => {
    // Create a temporary div to parse HTML and preserve formatting
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = conteudo;
    
    // Get text content preserving line breaks
    const textContent = tempDiv.innerText || tempDiv.textContent || '';
    
    navigator.clipboard.writeText(textContent);
    toast({
      title: "Script copiado!",
      description: "O conteúdo foi copiado para a área de transferência",
    });
  };

  const handleVisualizarScript = (script: Script) => {
    setViewingScript(script);
    setIsViewDialogOpen(true);
  };

  const estruturantes = Array.from(new Set(scripts.map(s => s.estruturante)));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Scripts de Atendimento</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Total de scripts cadastrados: <span className="font-semibold">{filteredScripts.length}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button variant="outline" onClick={handleExportarPDF} className="flex-1 sm:flex-none text-xs sm:text-sm">
            <FileDown className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Exportar PDF
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Plus className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Novo Script
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  {editingScript ? "Editar Script" : "Novo Script"}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Preencha as informações do script de atendimento
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.titulo_script}
                    onChange={(e) => setFormData({...formData, titulo_script: e.target.value})}
                    placeholder="Título do script"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.descricao_script}
                    onChange={(e) => setFormData({...formData, descricao_script: e.target.value})}
                    placeholder="Breve resumo do script"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estruturante *</Label>
                    <Input
                      value={formData.estruturante}
                      onChange={(e) => setFormData({...formData, estruturante: e.target.value})}
                      placeholder="Ex: TI, Financeiro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nível *</Label>
                    <Select
                      value={formData.nivel}
                      onValueChange={(value) => setFormData({...formData, nivel: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Nível 1</SelectItem>
                        <SelectItem value="2">Nível 2</SelectItem>
                        <SelectItem value="3">Nível 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Conteúdo *</Label>
                  <RichTextEditor
                    content={formData.conteudo_script}
                    onChange={(html) => setFormData({...formData, conteudo_script: html})}
                    placeholder="Conteúdo completo do script"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingScript ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estruturante</Label>
              <Select value={filtroEstruturante} onValueChange={setFiltroEstruturante}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {estruturantes.map(e => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nível</Label>
              <Select value={filtroNivel} onValueChange={setFiltroNivel}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="1">Nível 1</SelectItem>
                  <SelectItem value="2">Nível 2</SelectItem>
                  <SelectItem value="3">Nível 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:gap-4">
        {filteredScripts.map((script) => (
          <Card key={script.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">{script.estruturante}</Badge>
                    <Badge className="text-xs">Nível {script.nivel}</Badge>
                  </div>
                  <CardTitle className="text-base sm:text-lg break-words">{script.titulo_script}</CardTitle>
                  {script.descricao_script && (
                    <CardDescription className="mt-2 text-xs sm:text-sm break-words">
                      {script.descricao_script}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleVisualizarScript(script)}
                    title="Visualizar"
                    className="h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopiarScript(script.conteudo_script)}
                    title="Copiar"
                    className="h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(script)}
                    title="Editar"
                    className="h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(script.id)}
                    title="Excluir"
                    className="h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Dialog para visualizar script */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-base sm:text-lg break-words">{viewingScript?.titulo_script}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => viewingScript && handleCopiarScript(viewingScript.conteudo_script)}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <Copy className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Copiar Script
              </Button>
            </DialogTitle>
            <DialogDescription>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{viewingScript?.estruturante}</Badge>
                <Badge>Nível {viewingScript?.nivel}</Badge>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {viewingScript?.descricao_script && (
              <div>
                <Label className="text-sm font-semibold">Descrição</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {viewingScript.descricao_script}
                </p>
              </div>
            )}
            <div>
              <Label className="text-sm font-semibold">Conteúdo do Script</Label>
              <div 
                className="mt-2 p-4 bg-muted rounded-lg prose prose-sm max-w-none overflow-auto" 
                dangerouslySetInnerHTML={{ __html: viewingScript?.conteudo_script || '' }} 
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {filteredScripts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Nenhum script encontrado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Scripts;
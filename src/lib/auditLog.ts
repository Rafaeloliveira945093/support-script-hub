import { supabase } from "@/integrations/supabase/client";

export type AuditAction = 
  | "update" 
  | "status_change" 
  | "escalation" 
  | "moved_to_planner"
  | "response_added"
  | "notes_updated"
  | "link_added"
  | "link_removed"
  | "created"
  | "deleted";

export interface LogEntry {
  chamado_id: string;
  user_id: string;
  acao: AuditAction;
  campo_alterado?: string;
  valor_antigo?: string;
  valor_novo?: string;
}

export const logChamadoChange = async (entry: LogEntry) => {
  try {
    const { error } = await supabase
      .from("chamado_logs")
      .insert({
        ...entry,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error("Erro ao registrar log:", error);
    }
  } catch (error) {
    console.error("Erro ao registrar log:", error);
  }
};

export const logChamadoCreation = async (chamadoId: string, userId: string) => {
  await logChamadoChange({
    chamado_id: chamadoId,
    user_id: userId,
    acao: "created",
    campo_alterado: null,
    valor_antigo: null,
    valor_novo: null
  });
};

export const updateChamadoWithLog = async (
  chamadoId: string,
  userId: string,
  updates: Record<string, any>,
  previousValues: Record<string, any>
) => {
  try {
    // Atualizar chamado com last_edited
    const { error: updateError } = await supabase
      .from("chamados")
      .update({
        ...updates,
        last_edited_at: new Date().toISOString(),
        last_edited_by: userId
      })
      .eq("id", chamadoId);

    if (updateError) throw updateError;

    // Registrar logs para cada campo alterado
    for (const [campo, valorNovo] of Object.entries(updates)) {
      const valorAntigo = previousValues[campo];
      
      if (valorAntigo !== valorNovo && campo !== "last_edited_at" && campo !== "last_edited_by") {
        let acao: AuditAction = "update";
        
        // Determinar ação específica
        if (campo === "status") {
          acao = "status_change";
        } else if (campo === "nivel" && Number(valorNovo) > Number(valorAntigo)) {
          acao = "escalation";
        }
        
        await logChamadoChange({
          chamado_id: chamadoId,
          user_id: userId,
          acao,
          campo_alterado: campo,
          valor_antigo: String(valorAntigo),
          valor_novo: String(valorNovo)
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar chamado:", error);
    return { success: false, error };
  }
};

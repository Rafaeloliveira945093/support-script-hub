import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.76.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    console.log(`[${now.toISOString()}] Iniciando verificação de chamados expirados...`);

    // Buscar chamados com prazo definido e que ainda não expiraram (status diferente de fechado/encerrado)
    const { data: chamados, error: chamadosError } = await supabase
      .from("chamados")
      .select("id, numero_chamado, titulo, data_prazo, user_id, status")
      .not("data_prazo", "is", null)
      .lt("data_prazo", now.toISOString())
      .not("status", "in", '("Fechado","Encerrado","fechado","encerrado")');

    if (chamadosError) {
      console.error("Erro ao buscar chamados:", chamadosError);
      throw chamadosError;
    }

    console.log(`Encontrados ${chamados?.length || 0} chamados expirados`);

    if (!chamados || chamados.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Nenhum chamado expirado encontrado",
          count: 0,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Para cada chamado expirado, verificar se já existe notificação
    let notificacoesEnviadas = 0;

    for (const chamado of chamados) {
      // Verificar se já existe notificação não visualizada para este chamado
      const { data: notifExistente } = await supabase
        .from("notificacoes")
        .select("id")
        .eq("chamado_id", chamado.id)
        .eq("user_id", chamado.user_id)
        .eq("visualizada", false)
        .maybeSingle();

      // Se não existe, criar notificação
      if (!notifExistente) {
        const { error: notifError } = await supabase
          .from("notificacoes")
          .insert({
            user_id: chamado.user_id,
            chamado_id: chamado.id,
            mensagem: `PRAZO EXPIRADO: O chamado "${chamado.titulo}" (${chamado.numero_chamado || chamado.id.slice(0, 8)}) ultrapassou o prazo de 72h úteis. Por favor, atualize o status.`,
            visualizada: false,
          });

        if (notifError) {
          console.error(`Erro ao criar notificação para chamado ${chamado.id}:`, notifError);
        } else {
          notificacoesEnviadas++;
          console.log(`Notificação criada para chamado ${chamado.id}`);
        }
      } else {
        console.log(`Notificação já existe para chamado ${chamado.id}`);
      }
    }

    console.log(`Total de notificações enviadas: ${notificacoesEnviadas}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processados ${chamados.length} chamados expirados`,
        notificacoesEnviadas,
        chamadosVerificados: chamados.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error: any) {
    console.error("Erro na função:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
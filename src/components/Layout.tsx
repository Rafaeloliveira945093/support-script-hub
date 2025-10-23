import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, BarChart3, FileCode, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User, Session } from "@supabase/supabase-js";

const Layout = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session && location.pathname !== "/auth") {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/auth");
  };

  const getCurrentTab = () => {
    if (location.pathname === "/" || location.pathname.startsWith("/chamados")) {
      return "chamados";
    }
    if (location.pathname.startsWith("/relatorios")) {
      return "relatorios";
    }
    if (location.pathname.startsWith("/scripts")) {
      return "scripts";
    }
    return "chamados";
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary p-2">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Sistema de Chamados</h1>
                <p className="text-sm text-muted-foreground">Gerenciamento completo</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="border-b bg-card">
        <div className="container mx-auto px-4">
          <Tabs value={getCurrentTab()} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-0 bg-transparent h-auto p-0">
              <TabsTrigger
                value="chamados"
                onClick={() => navigate("/")}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <FileText className="mr-2 h-4 w-4" />
                Chamados
              </TabsTrigger>
              <TabsTrigger
                value="relatorios"
                onClick={() => navigate("/relatorios")}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Relatórios
              </TabsTrigger>
              <TabsTrigger
                value="scripts"
                onClick={() => navigate("/scripts")}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <FileCode className="mr-2 h-4 w-4" />
                Scripts de Atendimento
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
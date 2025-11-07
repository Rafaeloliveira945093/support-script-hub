import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, BarChart3, FileCode, LogOut, Moon, Sun, ExternalLink, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Notificacoes } from "@/components/Notificacoes";
import type { User, Session } from "@supabase/supabase-js";

const Layout = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

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

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

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
    if (location.pathname.startsWith("/links-uteis")) {
      return "links-uteis";
    }
    if (location.pathname.startsWith("/configuracoes")) {
      return "configuracoes";
    }
    return "chamados";
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="rounded-lg bg-primary p-1.5 sm:p-2">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold">Sistema de Chamados</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Gerenciamento completo</p>
              </div>
              <h1 className="sm:hidden text-base font-bold">Chamados</h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="outline" size="icon" onClick={toggleDarkMode} className="h-8 w-8 sm:h-10 sm:w-10">
                {isDarkMode ? <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              </Button>
              <Notificacoes />
              <Button variant="outline" onClick={handleLogout} className="h-8 sm:h-10 text-xs sm:text-sm">
                <LogOut className="mr-0 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="border-b bg-card overflow-x-auto">
        <div className="container mx-auto px-2 sm:px-4">
          <Tabs value={getCurrentTab()} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-0 bg-transparent h-auto p-0 min-w-max">
              <TabsTrigger
                value="chamados"
                onClick={() => navigate("/")}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap"
              >
                <FileText className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Chamados
              </TabsTrigger>
              <TabsTrigger
                value="relatorios"
                onClick={() => navigate("/relatorios")}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap"
              >
                <BarChart3 className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Relatórios
              </TabsTrigger>
              <TabsTrigger
                value="scripts"
                onClick={() => navigate("/scripts")}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap"
              >
                <FileCode className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Scripts
              </TabsTrigger>
              <TabsTrigger
                value="links-uteis"
                onClick={() => navigate("/links-uteis")}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap"
              >
                <ExternalLink className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Links
              </TabsTrigger>
              <TabsTrigger
                value="configuracoes"
                onClick={() => navigate("/configuracoes")}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap"
              >
                <Settings className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Config
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <Outlet key={location.pathname} />
      </main>
    </div>
  );
};

export default Layout;
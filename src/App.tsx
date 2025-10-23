import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Auth from "./pages/Auth";
import Chamados from "./pages/Chamados";
import NovoChamado from "./pages/NovoChamado";
import DetalhesChamado from "./pages/DetalhesChamado";
import Relatorios from "./pages/Relatorios";
import Scripts from "./pages/Scripts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Chamados />} />
            <Route path="chamados/novo" element={<NovoChamado />} />
            <Route path="chamados/:id" element={<DetalhesChamado />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="scripts" element={<Scripts />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

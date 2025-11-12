import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Empresas from "./pages/Empresas";
import Comunicacao from "./pages/Comunicacao";
import CRM from "./pages/CRM";
import CRMDetalhe from "./pages/CRMDetalhe";
import Financeiro from "./pages/Financeiro";
import FinanceiroDetalhe from "./pages/FinanceiroDetalhe";
import Parceiros from "./pages/Parceiros";
import Fornecedores from "./pages/Fornecedores";
import Mantenedores from "./pages/Mantenedores";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/crm" element={<CRM />} />
          <Route path="/dashboard/crm/:id" element={<CRMDetalhe />} />
          <Route path="/dashboard/empresas" element={<Empresas />} />
          <Route path="/dashboard/parceiros" element={<Parceiros />} />
          <Route path="/dashboard/fornecedores" element={<Fornecedores />} />
          <Route path="/dashboard/mantenedores" element={<Mantenedores />} />
          <Route path="/dashboard/financeiro" element={<Financeiro />} />
          <Route path="/dashboard/financeiro/:id" element={<FinanceiroDetalhe />} />
          <Route path="/dashboard/comunicacao" element={<Comunicacao />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

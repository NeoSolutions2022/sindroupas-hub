import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Empresas from "./pages/Empresas";
import Comunicacao from "./pages/Comunicacao";
import CRMDetalhe from "./pages/CRMDetalhe";
import Financeiro from "./pages/Financeiro";
import FinanceiroContribuicao from "./pages/FinanceiroContribuicao";
import FinanceiroDetalhe from "./pages/FinanceiroDetalhe";
import Relacionamentos from "./pages/Relacionamentos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/crm/:id"
              element={
                <ProtectedRoute>
                  <CRMDetalhe />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/empresas"
              element={
                <ProtectedRoute>
                  <Empresas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/relacionamentos"
              element={
                <ProtectedRoute>
                  <Relacionamentos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/financeiro"
              element={
                <ProtectedRoute>
                  <Financeiro />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/financeiro/contribuicao"
              element={
                <ProtectedRoute>
                  <FinanceiroContribuicao />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/financeiro/:id"
              element={
                <ProtectedRoute>
                  <FinanceiroDetalhe />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/comunicacao"
              element={
                <ProtectedRoute>
                  <Comunicacao />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

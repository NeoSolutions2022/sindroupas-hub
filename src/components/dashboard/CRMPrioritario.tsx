import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  MessageCircle, Eye, Building2, AlertTriangle, Phone, 
  UserX, FileWarning, Calendar, Cake, ChevronDown, ChevronUp,
  Pencil, Users
} from "lucide-react";
import { PrioridadeItem } from "./types";
import { getWhatsappLink, getResponsavel, formatCurrency, hasIncompleteData } from "./utils";

type FilterChip = "criticos" | "sem-whatsapp" | "dados-incompletos" | "vencendo" | "aniversarios";

interface CRMPrioritarioProps {
  empresas: PrioridadeItem[];
  onVerDetalhes: (empresa: PrioridadeItem) => void;
}

const SeloStatus = ({ selo }: { selo: "Crítico" | "Atenção" | "Oportunidade" }) => {
  const estilos = {
    Crítico: "bg-destructive text-destructive-foreground",
    Atenção: "bg-amber-500 text-white",
    Oportunidade: "bg-accent text-accent-foreground",
  };

  return (
    <Badge className={`${estilos[selo]} text-xs font-medium`}>
      {selo}
    </Badge>
  );
};

const filterLabels: Record<FilterChip, { label: string; icon: React.ElementType }> = {
  "criticos": { label: "Críticos", icon: AlertTriangle },
  "sem-whatsapp": { label: "Sem WhatsApp", icon: Phone },
  "dados-incompletos": { label: "Dados incompletos", icon: FileWarning },
  "vencendo": { label: "Vencendo", icon: Calendar },
  "aniversarios": { label: "Aniversários", icon: Cake },
};

export const CRMPrioritario = ({ empresas, onVerDetalhes }: CRMPrioritarioProps) => {
  const [activeFilters, setActiveFilters] = useState<FilterChip[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [editingWhatsapp, setEditingWhatsapp] = useState<PrioridadeItem | null>(null);
  const [whatsappDraft, setWhatsappDraft] = useState("");

  const toggleFilter = (filter: FilterChip) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Filtrar empresas
  const filteredEmpresas = useMemo(() => {
    if (activeFilters.length === 0) return empresas;

    return empresas.filter(empresa => {
      return activeFilters.some(filter => {
        switch (filter) {
          case "criticos":
            return empresa.selo === "Crítico";
          case "sem-whatsapp":
            return !empresa.whatsapp;
          case "dados-incompletos":
            return hasIncompleteData(empresa);
          case "vencendo":
            return empresa.proximoBoleto?.status === "A vencer";
          case "aniversarios":
            return empresa.chips.some(c => c.includes("niversário"));
          default:
            return true;
        }
      });
    });
  }, [empresas, activeFilters]);

  // Limitar a 6 ou mostrar todos
  const displayedEmpresas = showAll ? filteredEmpresas : filteredEmpresas.slice(0, 6);
  const hasMore = filteredEmpresas.length > 6;

  const handleOpenEditWhatsapp = (empresa: PrioridadeItem) => {
    setEditingWhatsapp(empresa);
    setWhatsappDraft(empresa.whatsapp || "");
  };

  const handleSaveWhatsapp = () => {
    // Mock save - em produção, chamaria API
    console.log("Salvando WhatsApp:", whatsappDraft, "para empresa:", editingWhatsapp?.nome);
    setEditingWhatsapp(null);
    setWhatsappDraft("");
  };

  return (
    <section aria-label="CRM Prioritário">
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-accent" />
              Empresas Prioritárias
              <Badge variant="outline" className="ml-2 text-xs">
                {filteredEmpresas.length} empresas
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Ordenação automática por prioridade
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros em chips */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(filterLabels) as FilterChip[]).map((filter) => {
              const { label, icon: Icon } = filterLabels[filter];
              const isActive = activeFilters.includes(filter);
              return (
                <Button
                  key={filter}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={`h-8 text-xs gap-1.5 ${
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => toggleFilter(filter)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Button>
              );
            })}
            {activeFilters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => setActiveFilters([])}
              >
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Lista de empresas */}
          {displayedEmpresas.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma empresa encontrada com os filtros selecionados
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedEmpresas.map((empresa, index) => {
                const responsavel = getResponsavel(empresa);
                const whatsappLink = getWhatsappLink(empresa.whatsapp);

                return (
                  <div
                    key={empresa.id}
                    className={`p-4 rounded-lg border bg-card transition-all hover:shadow-sm ${
                      empresa.selo === "Crítico" 
                        ? "border-l-4 border-l-destructive border-t-border border-r-border border-b-border" 
                        : empresa.selo === "Atenção" 
                        ? "border-l-4 border-l-amber-500 border-t-border border-r-border border-b-border" 
                        : "border-border"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      {/* Info da empresa */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 border border-border shrink-0">
                          <AvatarImage src={empresa.logo} alt={empresa.nome} />
                          <AvatarFallback className="bg-secondary text-foreground text-sm font-medium">
                            {empresa.nome.split(" ").slice(0, 2).map((p) => p[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-foreground truncate">
                              {empresa.nome}
                            </h3>
                            <SeloStatus selo={empresa.selo} />
                          </div>
                          
                          {/* Resumo financeiro */}
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                            {empresa.valorEmAberto && empresa.valorEmAberto > 0 && (
                              <span className="font-medium text-foreground">
                                {formatCurrency(empresa.valorEmAberto)} em aberto
                              </span>
                            )}
                            {empresa.diasInadimplente > 0 && (
                              <span>{empresa.diasInadimplente}d de atraso</span>
                            )}
                            {responsavel && (
                              <span>Resp: {responsavel.nome}</span>
                            )}
                          </div>

                          {/* Chips de contexto (limitados) */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {empresa.chips.slice(0, 2).map((chip, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* CTAs */}
                      <div className="flex items-center gap-2 shrink-0 sm:flex-col sm:items-end">
                        {whatsappLink ? (
                          <Button
                            asChild
                            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                            size="sm"
                          >
                            <a
                              href={whatsappLink}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Abrir WhatsApp de ${empresa.nome}`}
                            >
                              <MessageCircle className="h-4 w-4" />
                              Abrir WhatsApp
                            </a>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50"
                            onClick={() => handleOpenEditWhatsapp(empresa)}
                          >
                            <Pencil className="h-4 w-4" />
                            Adicionar WhatsApp
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onVerDetalhes(empresa)}
                          className="text-muted-foreground hover:text-foreground gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Ver detalhes
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Botão Ver mais / Ver menos */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground gap-1"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Ver todas ({filteredEmpresas.length - 6} restantes)
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para adicionar/editar WhatsApp */}
      <Dialog open={!!editingWhatsapp} onOpenChange={(open) => !open && setEditingWhatsapp(null)}>
        <DialogContent className="max-w-md">
          {editingWhatsapp && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-accent" />
                  Completar Cadastro
                </DialogTitle>
                <DialogDescription>
                  Adicione o WhatsApp para {editingWhatsapp.nome}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp (com DDD)</Label>
                  <Input
                    id="whatsapp"
                    placeholder="5511999999999"
                    value={whatsappDraft}
                    onChange={(e) => setWhatsappDraft(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Formato: código do país + DDD + número (ex: 5585999999999)
                  </p>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setEditingWhatsapp(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveWhatsapp} disabled={!whatsappDraft}>
                  Salvar WhatsApp
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

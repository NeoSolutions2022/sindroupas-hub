import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Search, Save, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
  empresaSearch: string;
  status: string[];
  tipo: string;
  dataInicio: Date | undefined;
  dataFim: Date | undefined;
  somenteInadimplentes: boolean;
  ordenacao: string;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onFilter: () => void;
  onClear: () => void;
  empresas: { id: string; nome: string }[];
}

const statusOptions = [
  { value: "Pago", label: "Pago", color: "bg-green-50 text-green-700 border-green-200" },
  { value: "Pendente", label: "Pendente", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "Atrasado", label: "Atrasado", color: "bg-destructive/10 text-destructive border-destructive/20" },
  { value: "Vencido", label: "Vencido", color: "bg-amber-50 text-amber-700 border-amber-200" },
];

export function AdvancedFilters({
  filters,
  onFiltersChange,
  onFilter,
  onClear,
  empresas,
}: AdvancedFiltersProps) {
  const [empresaSuggestions, setEmpresaSuggestions] = useState(false);

  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatus });
  };

  const filteredEmpresas = empresas.filter((emp) =>
    emp.nome.toLowerCase().includes(filters.empresaSearch.toLowerCase())
  );

  const hasActiveFilters = 
    filters.empresaSearch ||
    filters.status.length > 0 ||
    filters.tipo !== "todos" ||
    filters.dataInicio ||
    filters.dataFim ||
    filters.somenteInadimplentes;

  return (
    <Card className="shadow-card border-border mb-5">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-accent/10 p-1.5">
              <Filter className="h-4 w-4 text-accent" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Filtros</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Refine a visualização de boletos
              </p>
            </div>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="self-start text-xs font-medium text-muted-foreground hover:text-foreground h-8"
              onClick={onClear}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Limpar filtros
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Filters Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Empresa */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Empresa</Label>
            <div className="relative">
              <Input
                placeholder="Buscar empresa..."
                value={filters.empresaSearch}
                onChange={(e) => {
                  onFiltersChange({ ...filters, empresaSearch: e.target.value });
                  setEmpresaSuggestions(true);
                }}
                onFocus={() => setEmpresaSuggestions(true)}
                className="h-9 text-sm"
              />
              {empresaSuggestions &&
                filters.empresaSearch &&
                filteredEmpresas.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {filteredEmpresas.slice(0, 5).map((empresa) => (
                      <div
                        key={empresa.id}
                        className="px-3 py-2 hover:bg-secondary cursor-pointer text-sm transition-colors"
                        onClick={() => {
                          onFiltersChange({
                            ...filters,
                            empresaSearch: empresa.nome,
                          });
                          setEmpresaSuggestions(false);
                        }}
                      >
                        {empresa.nome}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>

          {/* Status Multi-Select */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Status</Label>
            <div className="flex flex-wrap gap-1.5">
              {statusOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all text-[10px] px-2 py-1 font-medium",
                    filters.status.includes(option.value)
                      ? option.color
                      : "bg-background hover:bg-secondary text-muted-foreground"
                  )}
                  onClick={() => toggleStatus(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Tipo</Label>
            <Select
              value={filters.tipo}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, tipo: value })
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="Mensalidade (por Faixa)">
                  Mensalidade (Faixa)
                </SelectItem>
                <SelectItem value="Contribuição Assistencial">
                  Contrib. Assistencial
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ordenação */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Ordenação</Label>
            <Select
              value={filters.ordenacao}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, ordenacao: value })
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Mais recentes" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="recentes">Mais recentes</SelectItem>
                <SelectItem value="valor">Maior valor</SelectItem>
                <SelectItem value="atrasados">Mais atrasados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date Range + Toggle Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap">
          {/* Período de vencimento */}
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">De</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 w-[130px] justify-start text-left text-sm font-normal",
                      !filters.dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {filters.dataInicio
                      ? format(filters.dataInicio, "dd/MM/yy")
                      : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dataInicio}
                    onSelect={(date) =>
                      onFiltersChange({ ...filters, dataInicio: date })
                    }
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Até</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 w-[130px] justify-start text-left text-sm font-normal",
                      !filters.dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {filters.dataFim
                      ? format(filters.dataFim, "dd/MM/yy")
                      : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dataFim}
                    onSelect={(date) =>
                      onFiltersChange({ ...filters, dataFim: date })
                    }
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Toggle Somente Inadimplentes */}
          <div className="flex items-center gap-2.5 h-9 px-3 rounded-lg border border-border bg-background">
            <Switch
              id="inadimplentes"
              checked={filters.somenteInadimplentes}
              onCheckedChange={(checked) =>
                onFiltersChange({ ...filters, somenteInadimplentes: checked })
              }
              className="scale-90"
            />
            <Label
              htmlFor="inadimplentes"
              className="text-xs font-medium cursor-pointer whitespace-nowrap"
            >
              Só inadimplentes
            </Label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
          <Button
            onClick={onFilter}
            size="sm"
            className="h-8 gap-1.5 text-xs bg-accent hover:bg-accent/90"
          >
            <Search className="h-3.5 w-3.5" />
            Filtrar
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Save className="h-3.5 w-3.5" />
            Salvar filtro
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export const defaultFilters: FilterState = {
  empresaSearch: "",
  status: [],
  tipo: "todos",
  dataInicio: undefined,
  dataFim: undefined,
  somenteInadimplentes: false,
  ordenacao: "recentes",
};

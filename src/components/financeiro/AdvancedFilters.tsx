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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Search, Save, X } from "lucide-react";
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
  { value: "Pago", label: "Pago" },
  { value: "Pendente", label: "Pendente" },
  { value: "Atrasado", label: "Atrasado" },
  { value: "Vencido", label: "Vencido" },
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

  return (
    <div className="rounded-xl border border-[#DCE7CB] bg-[#F7F8F4] p-5 shadow-sm mb-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">Filtros</h3>
          <p className="text-sm text-muted-foreground">
            Refine a visualização de boletos.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="self-start text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-transparent"
          onClick={onClear}
        >
          <X className="h-4 w-4 mr-1" />
          Limpar filtros
        </Button>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-5">
        {/* Empresa */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Empresa</Label>
          <div className="relative">
            <Input
              placeholder="Buscar empresa..."
              value={filters.empresaSearch}
              onChange={(e) => {
                onFiltersChange({ ...filters, empresaSearch: e.target.value });
                setEmpresaSuggestions(true);
              }}
              onFocus={() => setEmpresaSuggestions(true)}
              className="h-10"
            />
            {empresaSuggestions &&
              filters.empresaSearch &&
              filteredEmpresas.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredEmpresas.slice(0, 5).map((empresa) => (
                    <div
                      key={empresa.id}
                      className="px-3 py-2 hover:bg-accent cursor-pointer text-sm"
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
        <div className="space-y-2">
          <Label className="text-sm font-medium">Status</Label>
          <div className="flex flex-wrap gap-1.5">
            {statusOptions.map((option) => (
              <Badge
                key={option.value}
                variant={
                  filters.status.includes(option.value)
                    ? "default"
                    : "outline"
                }
                className={cn(
                  "cursor-pointer transition-colors text-xs px-2 py-1",
                  filters.status.includes(option.value)
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-accent"
                )}
                onClick={() => toggleStatus(option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tipo</Label>
          <Select
            value={filters.tipo}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, tipo: value })
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="Mensalidade (por Faixa)">
                Mensalidade (por Faixa)
              </SelectItem>
              <SelectItem value="Contribuição Assistencial">
                Contribuição Assistencial
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ordenação */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Ordenação</Label>
          <Select
            value={filters.ordenacao}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, ordenacao: value })
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Mais recentes" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="recentes">Mais recentes</SelectItem>
              <SelectItem value="valor">Maior valor</SelectItem>
              <SelectItem value="atrasados">Mais atrasados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Range + Toggle Row */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-5">
        {/* Período de vencimento */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Vencimento (De)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 w-[160px] justify-start text-left font-normal",
                    !filters.dataInicio && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dataInicio
                    ? format(filters.dataInicio, "dd/MM/yyyy")
                    : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background" align="start">
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

          <div className="space-y-2">
            <Label className="text-sm font-medium">Vencimento (Até)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 w-[160px] justify-start text-left font-normal",
                    !filters.dataFim && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dataFim
                    ? format(filters.dataFim, "dd/MM/yyyy")
                    : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background" align="start">
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
        <div className="flex items-center gap-3 h-10">
          <Switch
            id="inadimplentes"
            checked={filters.somenteInadimplentes}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, somenteInadimplentes: checked })
            }
          />
          <Label
            htmlFor="inadimplentes"
            className="text-sm font-medium cursor-pointer"
          >
            Somente inadimplentes
          </Label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-[#DCE7CB]">
        <Button
          onClick={onFilter}
          className="bg-[#00A86B] hover:bg-[#00A86B]/90"
        >
          <Search className="h-4 w-4 mr-2" />
          Filtrar
        </Button>
        <Button variant="outline">
          <Save className="h-4 w-4 mr-2" />
          Salvar filtro
        </Button>
      </div>
    </div>
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

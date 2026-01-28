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
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Search, ChevronDown } from "lucide-react";
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

  const hasActiveFilters = 
    filters.empresaSearch ||
    filters.status.length > 0 ||
    filters.tipo !== "todos" ||
    filters.dataInicio ||
    filters.dataFim ||
    filters.somenteInadimplentes;

  return (
    <div className="rounded-xl border border-[#DCE7CB] bg-[#F7F8F4] p-4 shadow-sm mb-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-[#1C1C1C]">Filtros</span>
          <span className="text-xs text-muted-foreground">
            Refine a visualização de boletos com os filtros abaixo.
          </span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            className="self-start shrink-0 p-0 text-sm font-semibold text-[#1C1C1C] hover:bg-transparent hover:underline"
            onClick={onClear}
            aria-label="Limpar filtros"
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Search + Filters Row */}
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
        {/* Search Input */}
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar empresa..."
            value={filters.empresaSearch}
            onChange={(e) => {
              onFiltersChange({ ...filters, empresaSearch: e.target.value });
              setEmpresaSuggestions(true);
            }}
            onFocus={() => setEmpresaSuggestions(true)}
            onBlur={() => setTimeout(() => setEmpresaSuggestions(false), 200)}
            className="h-11 rounded-full border-[#CBD5B1] bg-white pl-10 text-sm"
          />
          {empresaSuggestions &&
            filters.empresaSearch &&
            filteredEmpresas.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {filteredEmpresas.slice(0, 5).map((empresa) => (
                  <div
                    key={empresa.id}
                    className="px-3 py-2 hover:bg-secondary cursor-pointer text-sm transition-colors"
                    onMouseDown={() => {
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

        {/* Filter Selects Grid */}
        <div className="grid w-full gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {/* Status Multi-Select */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-11 justify-between rounded-full border-[#CBD5B1] bg-white text-sm text-[#1C1C1C] w-full"
              >
                <span className="truncate">
                  Status{filters.status.length > 0 ? ` • ${filters.status.join(", ")}` : ""}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 space-y-3 bg-popover" align="start">
              <p className="text-sm font-semibold text-[#1C1C1C]">Selecione o status</p>
              <div className="flex flex-col gap-2">
                {statusOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={filters.status.includes(option.value)}
                      onCheckedChange={() => toggleStatus(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Tipo */}
          <Select
            value={filters.tipo}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, tipo: value })
            }
          >
            <SelectTrigger className="h-11 rounded-full border-[#CBD5B1] bg-white text-sm">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="Mensalidade (por Faixa)">Mensalidade (Faixa)</SelectItem>
              <SelectItem value="Contribuição Assistencial">Contrib. Assistencial</SelectItem>
            </SelectContent>
          </Select>

          {/* Ordenação */}
          <Select
            value={filters.ordenacao}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, ordenacao: value })
            }
          >
            <SelectTrigger className="h-11 rounded-full border-[#CBD5B1] bg-white text-sm">
              <SelectValue placeholder="Ordenação" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="recentes">Mais recentes</SelectItem>
              <SelectItem value="valor">Maior valor</SelectItem>
              <SelectItem value="atrasados">Mais atrasados</SelectItem>
            </SelectContent>
          </Select>

          {/* Toggle Somente Inadimplentes */}
          <div className="flex items-center gap-2.5 h-11 px-4 rounded-full border border-[#CBD5B1] bg-white">
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
      </div>

      {/* Date Range Row */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <span className="text-xs font-medium text-muted-foreground">Período de vencimento:</span>
        
        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 w-[140px] justify-start text-left text-sm font-normal rounded-full border-[#CBD5B1] bg-white",
                  !filters.dataInicio && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {filters.dataInicio
                  ? format(filters.dataInicio, "dd/MM/yyyy")
                  : "De"}
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

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 w-[140px] justify-start text-left text-sm font-normal rounded-full border-[#CBD5B1] bg-white",
                  !filters.dataFim && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {filters.dataFim
                  ? format(filters.dataFim, "dd/MM/yyyy")
                  : "Até"}
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

        {/* Action Button */}
        <Button
          onClick={onFilter}
          size="sm"
          className="h-10 px-6 rounded-full bg-[#1C1C1C] hover:bg-[#1C1C1C]/90 text-sm ml-auto"
        >
          <Search className="h-4 w-4 mr-2" />
          Filtrar
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

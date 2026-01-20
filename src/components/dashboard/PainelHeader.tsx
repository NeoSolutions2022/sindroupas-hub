import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { PeriodoFiltro } from "./types";

interface PainelHeaderProps {
  periodo: PeriodoFiltro;
  onPeriodoChange: (periodo: PeriodoFiltro) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const PainelHeader = ({
  periodo,
  onPeriodoChange,
  searchQuery,
  onSearchChange,
}: PainelHeaderProps) => {
  const periodos: { value: PeriodoFiltro; label: string }[] = [
    { value: "hoje", label: "Hoje" },
    { value: "7dias", label: "7 dias" },
    { value: "30dias", label: "30 dias" },
  ];

  return (
    <header className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Painel do Sindicato
        </h1>
        <p className="text-sm text-muted-foreground">
          Acompanhamento diário de adimplência e relacionamento
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Seletor de período */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {periodos.map((p) => (
            <Button
              key={p.value}
              variant={periodo === p.value ? "default" : "ghost"}
              size="sm"
              className={
                periodo === p.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }
              onClick={() => onPeriodoChange(p.value)}
              aria-pressed={periodo === p.value}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {/* Busca global */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar empresa, responsável ou telefone..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-card border-border"
            aria-label="Buscar empresa, responsável ou telefone"
          />
        </div>
      </div>
    </header>
  );
};

import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CalendarClock, 
  Cake,
  CheckCircle2
} from "lucide-react";
import { formatCurrency } from "./utils";

interface KPICardProps {
  label: string;
  valor: string | number;
  variacao?: string;
  variacaoTipo?: "positivo" | "negativo" | "neutro";
  icone: React.ReactNode;
  corFundo?: string;
}

const KPICard = ({ label, valor, variacao, variacaoTipo, icone, corFundo }: KPICardProps) => {
  const variacaoColor = {
    positivo: "text-green-600",
    negativo: "text-destructive",
    neutro: "text-muted-foreground",
  };

  return (
    <div className={`rounded-xl border border-border p-4 ${corFundo || "bg-card"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
            {valor}
          </p>
          {variacao && (
            <div className={`mt-1 flex items-center gap-1 text-xs ${variacaoColor[variacaoTipo || "neutro"]}`}>
              {variacaoTipo === "positivo" && <TrendingUp className="h-3 w-3" />}
              {variacaoTipo === "negativo" && <TrendingDown className="h-3 w-3" />}
              <span>{variacao}</span>
            </div>
          )}
        </div>
        <div className="shrink-0 rounded-lg bg-secondary p-2">
          {icone}
        </div>
      </div>
    </div>
  );
};

interface VisaoExecutivaProps {
  adimplencia: number;
  adimplenciaAnterior: number;
  valorEmRisco: number;
  valorEmRiscoAnterior: number;
  empresasCriticas: number;
  proximosVencimentos15d: number;
  proximosEventos7d: number;
}

export const VisaoExecutiva = ({
  adimplencia,
  adimplenciaAnterior,
  valorEmRisco,
  valorEmRiscoAnterior,
  empresasCriticas,
  proximosVencimentos15d,
  proximosEventos7d,
}: VisaoExecutivaProps) => {
  const variacaoAdimplencia = adimplencia - adimplenciaAnterior;
  const variacaoRisco = ((valorEmRisco - valorEmRiscoAnterior) / valorEmRiscoAnterior) * 100;

  return (
    <section aria-label="Visão Executiva">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <KPICard
          label="Adimplência"
          valor={`${adimplencia.toFixed(1)}%`}
          variacao={`${variacaoAdimplencia > 0 ? "+" : ""}${variacaoAdimplencia.toFixed(1)}% vs anterior`}
          variacaoTipo={variacaoAdimplencia >= 0 ? "positivo" : "negativo"}
          icone={<CheckCircle2 className="h-5 w-5 text-accent" />}
          corFundo="bg-secondary/30"
        />
        
        <KPICard
          label="Valor em Risco"
          valor={formatCurrency(valorEmRisco)}
          variacao={`${variacaoRisco > 0 ? "+" : ""}${variacaoRisco.toFixed(0)}% vs anterior`}
          variacaoTipo={variacaoRisco <= 0 ? "positivo" : "negativo"}
          icone={<AlertTriangle className="h-5 w-5 text-destructive" />}
          corFundo={valorEmRisco > 30000 ? "bg-destructive/5" : "bg-card"}
        />
        
        <KPICard
          label="Empresas Críticas"
          valor={empresasCriticas}
          variacao="inadimpl. > 60 dias"
          variacaoTipo="neutro"
          icone={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          corFundo={empresasCriticas > 3 ? "bg-amber-50" : "bg-card"}
        />
        
        <KPICard
          label="Próx. Vencimentos"
          valor={proximosVencimentos15d}
          variacao="nos próximos 15 dias"
          variacaoTipo="neutro"
          icone={<CalendarClock className="h-5 w-5 text-accent" />}
        />
        
        <KPICard
          label="Próx. Eventos"
          valor={proximosEventos7d}
          variacao="aniversários em 7 dias"
          variacaoTipo="neutro"
          icone={<Cake className="h-5 w-5 text-accent" />}
        />
      </div>
    </section>
  );
};

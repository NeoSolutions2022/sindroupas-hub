import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CalendarClock, 
  CheckCircle2,
  Receipt,
  Clock
} from "lucide-react";

interface KPICardProps {
  label: string;
  valor: string | number;
  helper?: string;
  helperTipo?: "positivo" | "negativo" | "neutro";
  icone: React.ReactNode;
  destaque?: boolean;
}

const KPICard = ({ label, valor, helper, helperTipo = "neutro", icone, destaque }: KPICardProps) => {
  const helperColor = {
    positivo: "text-accent",
    negativo: "text-destructive",
    neutro: "text-muted-foreground",
  };

  return (
    <div className={`rounded-xl border border-border p-4 bg-card ${destaque ? "ring-1 ring-destructive/20" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
            {valor}
          </p>
          {helper && (
            <div className={`mt-1 flex items-center gap-1 text-xs ${helperColor[helperTipo]}`}>
              {helperTipo === "positivo" && <TrendingUp className="h-3 w-3" />}
              {helperTipo === "negativo" && <TrendingDown className="h-3 w-3" />}
              <span>{helper}</span>
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

interface NovasKPIsProps {
  inadimplencia: number;
  inadimplenciaVariacao: number;
  totalFaturadoMes: number;
  totalFaturadoVariacao: number;
  valorEmAtraso: number;
  qtdBoletosVencidos: number;
  empresasCriticas: number;
  proximosVencimentos: number;
}

export const NovasKPIs = ({
  inadimplencia,
  inadimplenciaVariacao,
  totalFaturadoMes,
  totalFaturadoVariacao,
  valorEmAtraso,
  qtdBoletosVencidos,
  empresasCriticas,
  proximosVencimentos,
}: NovasKPIsProps) => {
  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatVariacao = (value: number) => {
    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value.toFixed(1)}% vs mês anterior`;
  };

  return (
    <section aria-label="Indicadores Executivos">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <KPICard
          label="Inadimplência"
          valor={`${inadimplencia.toFixed(1)}%`}
          helper={formatVariacao(inadimplenciaVariacao)}
          helperTipo={inadimplenciaVariacao <= 0 ? "positivo" : "negativo"}
          icone={<CheckCircle2 className="h-5 w-5 text-accent" />}
        />
        
        <KPICard
          label="Total faturado no mês"
          valor={formatCurrency(totalFaturadoMes)}
          helper={formatVariacao(totalFaturadoVariacao)}
          helperTipo={totalFaturadoVariacao >= 0 ? "positivo" : "negativo"}
          icone={<Receipt className="h-5 w-5 text-accent" />}
        />
        
        <KPICard
          label="Valor em atraso"
          valor={formatCurrency(valorEmAtraso)}
          helper={`${qtdBoletosVencidos} boletos vencidos`}
          helperTipo="neutro"
          icone={<Clock className="h-5 w-5 text-destructive" />}
          destaque={valorEmAtraso > 30000}
        />
        
        <KPICard
          label="Empresas críticas"
          valor={empresasCriticas}
          helper="inadimpl. > 60 dias"
          helperTipo="neutro"
          icone={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          destaque={empresasCriticas > 3}
        />
        
        <KPICard
          label="Próx. vencimentos"
          valor={proximosVencimentos}
          helper="nos próximos 15 dias"
          helperTipo="neutro"
          icone={<CalendarClock className="h-5 w-5 text-accent" />}
        />
      </div>
    </section>
  );
};

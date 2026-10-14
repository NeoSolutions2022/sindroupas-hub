import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface ResumoCarteiraProps {
  boletosEmAtraso: number;
  empresasInadimplentes: number;
  empresasEmDia: number;
  onBoletosEmAtrasoClick?: () => void;
  onEmpresasInadimplentesClick?: () => void;
  onEmpresasEmDiaClick?: () => void;
}

export const ResumoCarteira = ({
  boletosEmAtraso,
  empresasInadimplentes,
  empresasEmDia,
  onBoletosEmAtrasoClick,
  onEmpresasInadimplentesClick,
  onEmpresasEmDiaClick,
}: ResumoCarteiraProps) => {
  const items = [
    {
      label: "Boletos em atraso",
      value: boletosEmAtraso,
      icon: Clock,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      onClick: onBoletosEmAtrasoClick,
    },
    {
      label: "Empresas inadimplentes",
      value: empresasInadimplentes,
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      onClick: onEmpresasInadimplentesClick,
    },
    {
      label: "Empresas em dia",
      value: empresasEmDia,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      onClick: onEmpresasEmDiaClick,
    },
  ];

  return (
    <Card className="shadow-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-accent/10 p-1.5">
            <Wallet className="h-4 w-4 text-accent" />
          </div>
          <CardTitle className="text-base font-semibold">Resumo da carteira</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {items.map((item) => (
          <button
            type="button"
            key={item.label}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-3 text-left transition-card hover:border-primary/40 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={item.onClick}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${item.bgColor}`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <span className="text-sm text-foreground">{item.label}</span>
            </div>
            <span className="text-xl font-bold text-foreground tabular-nums">{item.value}</span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
};

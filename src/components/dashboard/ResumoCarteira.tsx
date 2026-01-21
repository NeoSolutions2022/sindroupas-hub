import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface ResumoCarteiraProps {
  boletosEmAtraso: number;
  empresasInadimplentes: number;
  empresasEmDia: number;
}

export const ResumoCarteira = ({
  boletosEmAtraso,
  empresasInadimplentes,
  empresasEmDia,
}: ResumoCarteiraProps) => {
  const items = [
    {
      label: "Boletos em atraso",
      value: boletosEmAtraso,
      icon: Clock,
      color: "text-destructive",
    },
    {
      label: "Empresas inadimplentes",
      value: empresasInadimplentes,
      icon: AlertTriangle,
      color: "text-amber-600",
    },
    {
      label: "Empresas em dia",
      value: empresasEmDia,
      icon: CheckCircle2,
      color: "text-accent",
    },
  ];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-accent" />
          <CardTitle className="text-lg font-semibold">Resumo da carteira</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-2">
              <item.icon className={`h-4 w-4 ${item.color}`} />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
            <span className="text-lg font-bold text-foreground">{item.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingDown, ChevronRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, LabelList } from "recharts";
import { formatCurrency, formatDateFull, getWhatsappLink } from "./utils";

interface InadimplenciaFaixa {
  faixa: string;
  quantidade: number;
  valor: number;
}

interface ProximoVencimento {
  empresa: string;
  data: string;
  valor: number;
  status: string;
  whatsapp?: string;
}

interface MapaInadimplenciaProps {
  mapaInadimplencia: InadimplenciaFaixa[];
  proximosVencimentos: ProximoVencimento[];
}

export const MapaInadimplencia = ({ 
  mapaInadimplencia, 
  proximosVencimentos 
}: MapaInadimplenciaProps) => {
  // Preparar dados com labels
  const chartData = mapaInadimplencia.map((item) => ({
    ...item,
    label: `${item.quantidade} emp. • ${formatCurrency(item.valor)}`,
  }));

  // Calcular totais
  const totalEmpresas = mapaInadimplencia.reduce((acc, item) => acc + item.quantidade, 0);
  const totalValor = mapaInadimplencia.reduce((acc, item) => acc + item.valor, 0);

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="h-5 w-5 text-destructive" />
            Mapa de Inadimplência
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link to="/financeiro">
              Ver todos <ChevronRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{totalEmpresas}</span> empresas
          </div>
          <div className="text-xs text-muted-foreground">
            Total: <span className="font-medium text-foreground">{formatCurrency(totalValor)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gráfico com números */}
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ right: 100 }}>
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="faixa" 
                width={70} 
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Faixa: ${label}`}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={index} 
                    fill={
                      index === 3 
                        ? "hsl(var(--destructive))" 
                        : index === 2 
                        ? "#f59e0b" 
                        : index === 1 
                        ? "#fbbf24" 
                        : "hsl(var(--accent))"
                    } 
                  />
                ))}
                <LabelList
                  dataKey="label"
                  position="right"
                  style={{ 
                    fontSize: 10, 
                    fill: "hsl(var(--muted-foreground))",
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda com números por faixa */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {mapaInadimplencia.map((item, idx) => (
            <div 
              key={idx}
              className="flex flex-col items-center p-2 rounded-lg bg-secondary/30 text-center"
            >
              <span className="text-xs text-muted-foreground">{item.faixa}</span>
              <span className="text-sm font-semibold text-foreground">{item.quantidade}</span>
              <span className="text-xs text-muted-foreground">{formatCurrency(item.valor)}</span>
            </div>
          ))}
        </div>
        
        {/* Próximos Vencimentos Compacto */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
            Próximos Vencimentos (15 dias)
          </p>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30">
                  <TableHead className="text-xs py-2">Empresa</TableHead>
                  <TableHead className="text-xs py-2">Venc.</TableHead>
                  <TableHead className="text-xs py-2 text-right">Valor</TableHead>
                  <TableHead className="text-xs py-2 w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proximosVencimentos.slice(0, 3).map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs py-2 font-medium">{item.empresa}</TableCell>
                    <TableCell className="text-xs py-2">
                      <Badge 
                        variant={item.status === "Hoje" ? "destructive" : "outline"} 
                        className="text-xs px-1.5 py-0"
                      >
                        {formatDateFull(item.data)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs py-2 text-right">
                      {formatCurrency(item.valor)}
                    </TableCell>
                    <TableCell className="py-2">
                      {item.whatsapp && (
                        <Button asChild variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <a 
                            href={getWhatsappLink(item.whatsapp)} 
                            target="_blank" 
                            rel="noreferrer"
                            aria-label={`WhatsApp de ${item.empresa}`}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

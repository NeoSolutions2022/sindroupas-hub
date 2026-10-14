import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/components/dashboard/utils";

export type ReceitaMensalItem<T> = {
  chave: string;
  mes: string;
  recebido: number;
  previsto: number;
  inadimplente: number;
  boletosRecebidos: T[];
  boletosPrevistos: T[];
  boletosInadimplentes: T[];
};

type ReceitasMensaisProps<T> = {
  ano: number;
  itens: ReceitaMensalItem<T>[];
  onAnoChange: (ano: number) => void;
  onDetalhar: (titulo: string, descricao: string, boletos: T[]) => void;
};

const Resumo = ({ label, valor, className }: { label: string; valor: number; className: string }) => (
  <div className="rounded-lg border bg-background p-3">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className={`mt-1 text-xl font-bold tabular-nums ${className}`}>{formatCurrency(valor)}</p>
  </div>
);

export const ReceitasMensais = <T,>({ ano, itens, onAnoChange, onDetalhar }: ReceitasMensaisProps<T>) => {
  const [aberto, setAberto] = useState(false);
  const totais = itens.reduce(
    (acc, item) => ({
      recebido: acc.recebido + item.recebido,
      previsto: acc.previsto + item.previsto,
      inadimplente: acc.inadimplente + item.inadimplente,
    }),
    { recebido: 0, previsto: 0, inadimplente: 0 },
  );

  const detalhar = (
    item: ReceitaMensalItem<T>,
    tipo: "recebido" | "previsto" | "inadimplente",
  ) => {
    const configuracao = {
      recebido: {
        titulo: `Receita recebida — ${item.mes} de ${ano}`,
        descricao: `Boletos pagos com vencimento em ${item.mes.toLowerCase()} de ${ano}.`,
        boletos: item.boletosRecebidos,
      },
      previsto: {
        titulo: `Receita prevista — ${item.mes} de ${ano}`,
        descricao: `Boletos aguardando pagamento com vencimento em ${item.mes.toLowerCase()} de ${ano}.`,
        boletos: item.boletosPrevistos,
      },
      inadimplente: {
        titulo: `Inadimplência — ${item.mes} de ${ano}`,
        descricao: `Boletos inadimplentes ou vencidos sem pagamento em ${item.mes.toLowerCase()} de ${ano}.`,
        boletos: item.boletosInadimplentes,
      },
    }[tipo];

    onDetalhar(configuracao.titulo, configuracao.descricao, configuracao.boletos);
  };

  return (
    <Collapsible open={aberto} onOpenChange={setAberto} asChild>
      <Card>
        <CollapsibleTrigger asChild>
          <button type="button" className="w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <CardHeader className="flex-row items-center justify-between gap-3 py-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-accent/10 p-2">
                  <CircleDollarSign className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-base">Receitas mensais</CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {aberto ? "Clique para recolher o painel." : "Clique para consultar recebimentos, previsões e inadimplência."}
                  </p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${aberto ? "rotate-180" : ""}`} />
            </CardHeader>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-end gap-1" aria-label="Selecionar ano das receitas">
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => onAnoChange(ano - 1)} aria-label="Ano anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-16 text-center text-sm font-semibold tabular-nums">{ano}</span>
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => onAnoChange(ano + 1)} aria-label="Próximo ano">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Resumo label={`Receita recebida em ${ano}`} valor={totais.recebido} className="text-green-700" />
          <Resumo label={`Receita prevista em ${ano}`} valor={totais.previsto} className="text-blue-700" />
          <Resumo label={`Inadimplência em ${ano}`} valor={totais.inadimplente} className="text-destructive" />
        </div>

        <div className="overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Recebida</TableHead>
                <TableHead className="text-right">Prevista</TableHead>
                <TableHead className="text-right">Inadimplência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((item) => (
                <TableRow key={item.chave}>
                  <TableCell className="font-medium">{item.mes}</TableCell>
                  <TableCell className="p-0 text-right">
                    <button type="button" className="w-full px-4 py-3 text-right font-medium text-green-700 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" onClick={() => detalhar(item, "recebido")}>
                      {formatCurrency(item.recebido)}
                    </button>
                  </TableCell>
                  <TableCell className="p-0 text-right">
                    <button type="button" className="w-full px-4 py-3 text-right font-medium text-blue-700 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" onClick={() => detalhar(item, "previsto")}>
                      {formatCurrency(item.previsto)}
                    </button>
                  </TableCell>
                  <TableCell className="p-0 text-right">
                    <button type="button" className="w-full px-4 py-3 text-right font-medium text-destructive hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" onClick={() => detalhar(item, "inadimplente")}>
                      {formatCurrency(item.inadimplente)}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          Pago entra em receita recebida; aguardando e ainda não vencido entra em receita prevista; vencido ou inadimplente entra em inadimplência. Cancelados não entram nos cálculos.
        </p>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Pencil } from "lucide-react";

export interface EmpresaIncompleta {
  id: number;
  nome: string;
  missingFields: string[];
}

interface EmpresasIncompletasProps {
  empresas: EmpresaIncompleta[];
  onCorrigir: (empresa: EmpresaIncompleta, focusField?: string) => void;
}

const FIELD_LABELS: Record<string, string> = {
  whatsapp: "Sem WhatsApp",
  responsavel: "Sem responsável",
  logo: "Sem logo",
  dataFundacao: "Sem data fundação",
  aniversarioResponsavel: "Sem aniversário",
};

export const EmpresasIncompletas = ({
  empresas,
  onCorrigir,
}: EmpresasIncompletasProps) => {
  if (empresas.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-amber-50 p-1.5">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <CardTitle className="text-base font-semibold">Dados incompletos</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs font-normal">
            {empresas.length} empresa{empresas.length > 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {empresas.slice(0, 6).map((empresa) => (
          <div
            key={empresa.id}
            className="flex flex-col gap-2.5 rounded-lg border border-border bg-background p-3 transition-card hover:shadow-card sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{empresa.nome}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {empresa.missingFields.slice(0, 2).map((field) => (
                  <Badge
                    key={field}
                    variant="outline"
                    className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 border-amber-200"
                  >
                    {FIELD_LABELS[field] || field}
                  </Badge>
                ))}
                {empresa.missingFields.length > 2 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                    +{empresa.missingFields.length - 2}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs shrink-0 hover:bg-accent hover:text-accent-foreground"
              onClick={() => onCorrigir(empresa, empresa.missingFields[0])}
              aria-label={`Corrigir dados de ${empresa.nome}`}
            >
              <Pencil className="h-3 w-3" />
              Corrigir
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

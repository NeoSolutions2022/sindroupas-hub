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
  whatsapp: "Sem WhatsApp do responsável",
  responsavel: "Sem responsável",
  logo: "Sem logo",
  dataFundacao: "Sem data de fundação",
  aniversarioResponsavel: "Sem data de nascimento do responsável",
};

export const EmpresasIncompletas = ({
  empresas,
  onCorrigir,
}: EmpresasIncompletasProps) => {
  if (empresas.length === 0) {
    return null;
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-lg font-semibold">Empresas com dados incompletos</CardTitle>
          <Badge variant="outline" className="text-muted-foreground">
            {empresas.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {empresas.slice(0, 6).map((empresa) => (
            <div
              key={empresa.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 border-b border-border last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{empresa.nome}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {empresa.missingFields.slice(0, 2).map((field) => (
                    <Badge
                      key={field}
                      variant="secondary"
                      className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                    >
                      {FIELD_LABELS[field] || field}
                    </Badge>
                  ))}
                  {empresa.missingFields.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{empresa.missingFields.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => onCorrigir(empresa, empresa.missingFields[0])}
                aria-label={`Corrigir dados de ${empresa.nome}`}
              >
                <Pencil className="h-3.5 w-3.5" />
                Corrigir agora
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

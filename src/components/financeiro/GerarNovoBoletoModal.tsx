import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface GerarNovoBoletoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boleto: {
    id: string;
    empresa: string;
    vencimento: string;
    valor: number;
  } | null;
  onGenerate: (boletoId: string, novaData: Date) => void;
}

export function GerarNovoBoletoModal({
  open,
  onOpenChange,
  boleto,
  onGenerate,
}: GerarNovoBoletoModalProps) {
  const { toast } = useToast();
  const [novaData, setNovaData] = useState<Date | undefined>(
    addDays(new Date(), 30)
  );

  const handleGenerate = () => {
    if (!boleto || !novaData) return;

    onGenerate(boleto.id, novaData);
    toast({
      title: "Novo boleto gerado (mock)",
      description: `Boleto para ${boleto.empresa} com vencimento em ${format(novaData, "dd/MM/yyyy")}`,
    });
    onOpenChange(false);
    setNovaData(addDays(new Date(), 30));
  };

  if (!boleto) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Gerar novo boleto
          </DialogTitle>
          <DialogDescription>
            Crie um novo boleto com nova data de vencimento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Empresa</Label>
            <p className="font-medium">{boleto.empresa}</p>
          </div>

          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">
              Vencimento original
            </Label>
            <p className="font-medium">{boleto.vencimento}</p>
          </div>

          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Valor</Label>
            <p className="font-medium">
              R$ {boleto.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Label className="text-sm font-medium">
              Nova data de vencimento*
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-10 justify-start text-left font-normal",
                    !novaData && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {novaData
                    ? format(novaData, "dd/MM/yyyy")
                    : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background" align="start">
                <Calendar
                  mode="single"
                  selected={novaData}
                  onSelect={setNovaData}
                  locale={ptBR}
                  disabled={(date) => date < new Date()}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Sugestão: +30 dias a partir de hoje
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!novaData}
            className="bg-[#00A86B] hover:bg-[#00A86B]/90"
          >
            Gerar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

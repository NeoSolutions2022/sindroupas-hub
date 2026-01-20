import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarDays, MessageCircle, Copy, Check, User, Building2, 
  ChevronRight, Cake, PartyPopper
} from "lucide-react";
import { AgendaItem } from "./types";
import { formatDateFull, getWhatsappLink } from "./utils";

interface AgendaRelacionamentoProps {
  agenda: AgendaItem[];
  onVerAgendaCompleta?: () => void;
}

export const AgendaRelacionamento = ({ 
  agenda,
  onVerAgendaCompleta 
}: AgendaRelacionamentoProps) => {
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  const handleCopyMessage = (message: string, id: string) => {
    navigator.clipboard.writeText(message);
    setCopiedMessage(id);
    setTimeout(() => setCopiedMessage(null), 2000);
  };

  // Separar por tipo
  const aniversariosResponsaveis = agenda.filter(a => a.tipo === "responsavel");
  const aniversariosEmpresas = agenda.filter(a => a.tipo === "empresa");

  const renderAgendaItem = (item: AgendaItem, idx: number, tipo: "responsavel" | "empresa") => {
    const whatsappLink = getWhatsappLink(item.whatsapp, item.sugestaoMensagem);
    const uniqueId = `${tipo}-${idx}`;
    
    return (
      <div 
        key={uniqueId} 
        className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border hover:border-accent/50 transition-colors"
      >
        <div className="shrink-0 w-12 text-center">
          <p className="text-lg font-bold text-foreground">
            {formatDateFull(item.data).split(" ")[0]}
          </p>
          <p className="text-xs text-muted-foreground uppercase">
            {formatDateFull(item.data).split(" ")[1]}
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm text-foreground truncate">
              {item.nome}
            </span>
          </div>
          {item.empresa && (
            <p className="text-xs text-muted-foreground truncate">{item.empresa}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs hover:bg-secondary"
              onClick={() => handleCopyMessage(item.sugestaoMensagem, uniqueId)}
            >
              {copiedMessage === uniqueId ? (
                <Check className="h-3 w-3 mr-1 text-accent" />
              ) : (
                <Copy className="h-3 w-3 mr-1" />
              )}
              {copiedMessage === uniqueId ? "Copiado!" : "Copiar msg"}
            </Button>
            {whatsappLink ? (
              <Button asChild size="sm" className="h-7 px-2 text-xs bg-primary">
                <a href={whatsappLink} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
                </a>
              </Button>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Sem WhatsApp
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  const hasAnyEvent = agenda.length > 0;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5 text-accent" />
            Agenda de Relacionamento
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-accent/50 text-accent">
              7 dias
            </Badge>
            {onVerAgendaCompleta && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-7"
                onClick={onVerAgendaCompleta}
              >
                Ver agenda completa
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasAnyEvent ? (
          <div className="text-center py-8">
            <div className="rounded-full bg-secondary p-3 w-fit mx-auto mb-3">
              <PartyPopper className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhum evento nos próximos 7 dias
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Coluna: Aniversários de Responsáveis */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <User className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-medium text-foreground">
                  Aniversário do Responsável
                </h3>
                <Badge variant="secondary" className="text-xs ml-auto">
                  {aniversariosResponsaveis.length}
                </Badge>
              </div>
              {aniversariosResponsaveis.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhum aniversário de responsável
                </p>
              ) : (
                <div className="space-y-2">
                  {aniversariosResponsaveis.map((item, idx) => 
                    renderAgendaItem(item, idx, "responsavel")
                  )}
                </div>
              )}
            </div>

            {/* Coluna: Aniversários de Empresas */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Building2 className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-medium text-foreground">
                  Aniversário / Fundação
                </h3>
                <Badge variant="secondary" className="text-xs ml-auto">
                  {aniversariosEmpresas.length}
                </Badge>
              </div>
              {aniversariosEmpresas.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhum aniversário de empresa
                </p>
              ) : (
                <div className="space-y-2">
                  {aniversariosEmpresas.map((item, idx) => 
                    renderAgendaItem(item, idx, "empresa")
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

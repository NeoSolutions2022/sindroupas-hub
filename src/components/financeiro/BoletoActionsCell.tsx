import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  Download,
  MessageCircle,
  Mail,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";

interface BoletoActionsCellProps {
  status: string;
  whatsappLink: string | null;
  onDetails: () => void;
  onDownload: () => void;
  onGenerateNew: () => void;
  onChangeDueDate?: () => void;
  onChangeCompetencia?: () => void;
  onCancel?: () => void;
  onDescription?: () => void;
  onWhatsApp?: () => void;
  onEmail?: () => void;
  onReplicate?: () => void;
  onCommunication?: () => void;
  onEditCompany?: () => void;
}

export function BoletoActionsCell({
  status,
  whatsappLink,
  onDetails,
  onDownload,
  onGenerateNew,
  onChangeDueDate,
  onChangeCompetencia,
  onCancel,
  onDescription,
  onWhatsApp,
  onEmail,
  onReplicate,
  onCommunication,
  onEditCompany,
}: BoletoActionsCellProps) {
  const isOverdue = status === "Atrasado" || status === "Vencido";
  const isCanceled = status === "Cancelado";
  const communicationItems = (
    <>
      {onWhatsApp && (
        <DropdownMenuItem onClick={onWhatsApp}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Enviar por WhatsApp
        </DropdownMenuItem>
      )}
      {onEmail && (
        <DropdownMenuItem onClick={onEmail}>
          <Mail className="h-4 w-4 mr-2" />
          Enviar por e-mail
        </DropdownMenuItem>
      )}
    </>
  );

  if (isOverdue) {
    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="default"
          size="sm"
          onClick={onGenerateNew}
          className="bg-[#00A86B] hover:bg-[#00A86B]/90 text-xs h-8"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Gerar novo
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background">
            <DropdownMenuItem onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            {whatsappLink && (
              <DropdownMenuItem asChild>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </a>
              </DropdownMenuItem>
            )}
            {communicationItems}
            <DropdownMenuItem onClick={onDetails}>
              <Eye className="h-4 w-4 mr-2" />
              Detalhes
            </DropdownMenuItem>
            {onChangeDueDate && (
              <DropdownMenuItem onClick={onChangeDueDate}>
                Alterar vencimento
              </DropdownMenuItem>
            )}
            {onChangeCompetencia && (
              <DropdownMenuItem onClick={onChangeCompetencia}>
                Alterar competência
              </DropdownMenuItem>
            )}
            {onCancel && (
              <DropdownMenuItem onClick={onCancel} className="text-destructive focus:text-destructive">
                Cancelar boleto
              </DropdownMenuItem>
            )}
            {onCommunication && <DropdownMenuItem onClick={onCommunication}>Comunicação</DropdownMenuItem>}
            {onEditCompany && <DropdownMenuItem onClick={onEditCompany}>Editar dados da empresa</DropdownMenuItem>}

          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Pendente / Emitida / Pago / Cancelada
  return (
    <div className="flex items-center justify-end gap-1">
      {isCanceled && (
        <Button
          variant="default"
          size="sm"
          onClick={onGenerateNew}
          className="bg-[#00A86B] hover:bg-[#00A86B]/90 text-xs h-8"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Gerar novo
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={onDetails} className="h-8 text-xs">
        <Eye className="h-3.5 w-3.5 mr-1" />
        Detalhes
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background">
          <DropdownMenuItem onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </DropdownMenuItem>
          {whatsappLink && (
            <DropdownMenuItem asChild>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </a>
            </DropdownMenuItem>
          )}
          {communicationItems}
          {onReplicate && (
            <DropdownMenuItem onClick={onReplicate}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Replicar
            </DropdownMenuItem>
          )}
          {onChangeDueDate && (
            <DropdownMenuItem onClick={onChangeDueDate}>
              Alterar vencimento
            </DropdownMenuItem>
          )}
          {onChangeCompetencia && (
            <DropdownMenuItem onClick={onChangeCompetencia}>
              Alterar competência
            </DropdownMenuItem>
          )}
          {onCancel && (
            <DropdownMenuItem onClick={onCancel} className="text-destructive focus:text-destructive">
              Cancelar boleto
            </DropdownMenuItem>
          )}
          {onDescription && <DropdownMenuItem onClick={onDescription}>Descrição</DropdownMenuItem>}
          {onCommunication && <DropdownMenuItem onClick={onCommunication}>Comunicação</DropdownMenuItem>}
          {onEditCompany && <DropdownMenuItem onClick={onEditCompany}>Editar dados da empresa</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

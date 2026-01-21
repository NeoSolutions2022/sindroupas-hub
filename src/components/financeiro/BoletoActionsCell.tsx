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
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";

interface BoletoActionsCellProps {
  status: string;
  whatsappLink: string | null;
  onDetails: () => void;
  onDownload: () => void;
  onGenerateNew: () => void;
  onWhatsApp?: () => void;
}

export function BoletoActionsCell({
  status,
  whatsappLink,
  onDetails,
  onDownload,
  onGenerateNew,
}: BoletoActionsCellProps) {
  const isOverdue = status === "Atrasado" || status === "Vencido";
  const isPaid = status === "Pago";

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
            <DropdownMenuItem onClick={onDetails}>
              <Eye className="h-4 w-4 mr-2" />
              Detalhes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  if (isPaid) {
    return (
      <div className="flex items-center justify-end gap-1">
        <Button variant="outline" size="sm" onClick={onDetails} className="h-8 text-xs">
          <Eye className="h-3.5 w-3.5 mr-1" />
          Detalhes
        </Button>
        <Button variant="ghost" size="icon" onClick={onDownload} className="h-8 w-8">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Pendente / Emitida
  return (
    <div className="flex items-center justify-end gap-1">
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

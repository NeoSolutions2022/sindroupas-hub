import { Empresa, PrioridadeItem } from "./types";

// Formatação de moeda
export const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Funções de data
export const getToday = () => new Date();

export const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const differenceInDays = (dateA: Date, dateB: Date) => {
  const diff = startOfDay(dateA).getTime() - startOfDay(dateB).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

export const isWithinNextDays = (dateString?: string, days = 7) => {
  if (!dateString) return false;
  const target = new Date(dateString);
  const today = getToday();
  const diff = differenceInDays(target, today);
  return diff >= 0 && diff <= days;
};

export const formatDate = (date?: string) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

export const formatDateFull = (date?: string) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR", { 
    day: "2-digit", 
    month: "short" 
  });
};

// WhatsApp utilities
export const formatWhatsappDisplay = (value?: string) => {
  if (!value) return "Sem WhatsApp";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10) return value;
  const sanitized = digits.startsWith("55") ? digits.slice(2) : digits;
  const ddd = sanitized.slice(0, 2);
  const numberPart = sanitized.slice(2);
  if (numberPart.length === 9) return `(${ddd}) ${numberPart.slice(0, 5)}-${numberPart.slice(5)}`;
  if (numberPart.length === 8) return `(${ddd}) ${numberPart.slice(0, 4)}-${numberPart.slice(4)}`;
  return `+${digits}`;
};

export const getWhatsappLink = (value?: string, message?: string) => {
  if (!value) return undefined;
  const baseUrl = `https://wa.me/${value}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
};

// Obter responsável com fallback para colaborador
export const getResponsavel = (empresa: Empresa) => {
  if (empresa.responsavel) return empresa.responsavel;
  return empresa.colaboradores[0] ?? null;
};

// Calcular score de prioridade
export const calcularScorePrioridade = (empresa: Empresa): number => {
  const PESO_INADIMPLENCIA = 2;
  const PESO_VALOR = 0.001;
  const PESO_SEM_CONTATO = 1;
  const PESO_EVENTO = 3;

  let score = 0;

  // Inadimplência
  score += PESO_INADIMPLENCIA * (empresa.diasInadimplente || 0);

  // Valor em aberto
  score += PESO_VALOR * (empresa.valorEmAberto || 0);

  // Dias sem contato
  if (empresa.ultimoContato) {
    const diasSemContato = differenceInDays(getToday(), new Date(empresa.ultimoContato));
    score += PESO_SEM_CONTATO * Math.max(0, diasSemContato);
  } else {
    score += PESO_SEM_CONTATO * 180; // Penalidade por não ter registro
  }

  // Proximidade de evento (bônus negativo para dar prioridade)
  if (isWithinNextDays(empresa.aniversarioResponsavel, 7) || 
      isWithinNextDays(empresa.aniversarioEmpresa, 7)) {
    score += PESO_EVENTO * 30;
  }

  // Múltiplos atrasos
  if ((empresa.multiplosAtrasos || 0) >= 2) {
    score += 100;
  }

  return score;
};

// Gerar item de prioridade com motivo e selo
export const gerarPrioridadeItem = (empresa: Empresa): PrioridadeItem => {
  const score = calcularScorePrioridade(empresa);
  const chips: string[] = [];
  let motivo = "";
  let selo: "Crítico" | "Atenção" | "Oportunidade" = "Oportunidade";
  let recomendacao = "";

  // Determinar selo e motivo
  if (empresa.diasInadimplente > 60 || (empresa.multiplosAtrasos || 0) >= 2) {
    selo = "Crítico";
  } else if (empresa.diasInadimplente > 0 || empresa.situacao === "Inadimplente") {
    selo = "Atenção";
  }

  // Gerar chips de contexto
  if (empresa.valorEmAberto && empresa.valorEmAberto > 0) {
    chips.push(formatCurrency(empresa.valorEmAberto) + " em aberto");
  }

  if (empresa.ultimoContato) {
    const diasSemContato = differenceInDays(getToday(), new Date(empresa.ultimoContato));
    if (diasSemContato > 30) {
      chips.push(`Último contato há ${diasSemContato}d`);
    }
  } else {
    chips.push("Sem registro de contato");
  }

  if (isWithinNextDays(empresa.proximoBoleto?.data, 3)) {
    chips.push(`Vence em ${differenceInDays(new Date(empresa.proximoBoleto.data), getToday())}d`);
  }

  if (isWithinNextDays(empresa.aniversarioResponsavel, 7)) {
    chips.push("Aniversário responsável próximo");
  }

  if (isWithinNextDays(empresa.aniversarioEmpresa, 7)) {
    chips.push("Aniversário empresa próximo");
  }

  // Gerar motivo
  const motivos: string[] = [];
  if (empresa.diasInadimplente > 0) {
    motivos.push(`Atraso ${empresa.diasInadimplente}d`);
  }
  if ((empresa.multiplosAtrasos || 0) >= 2) {
    motivos.push(`${empresa.multiplosAtrasos} boletos atrasados`);
  }
  if (empresa.valorEmAberto && empresa.valorEmAberto > 1000) {
    motivos.push("valor alto");
  }
  if (empresa.ultimoContato) {
    const diasSemContato = differenceInDays(getToday(), new Date(empresa.ultimoContato));
    if (diasSemContato > 60) {
      motivos.push("sem contato recente");
    }
  }
  if (isWithinNextDays(empresa.aniversarioResponsavel, 3) || 
      isWithinNextDays(empresa.aniversarioEmpresa, 3)) {
    motivos.push("aniversário próximo");
  }

  motivo = motivos.length > 0 ? motivos.join(" + ") : "Acompanhamento regular";

  // Recomendação
  if (selo === "Crítico") {
    recomendacao = "Cobrar boleto";
  } else if (isWithinNextDays(empresa.aniversarioResponsavel, 3) || 
             isWithinNextDays(empresa.aniversarioEmpresa, 3)) {
    recomendacao = "Parabenizar";
  } else if (!empresa.whatsapp || !getResponsavel(empresa)?.whatsapp) {
    recomendacao = "Atualizar contato";
  } else if (empresa.situacao === "Inadimplente") {
    recomendacao = "Cobrar boleto";
  } else {
    recomendacao = "Manter relacionamento";
  }

  return {
    ...empresa,
    score,
    motivo,
    selo,
    recomendacao,
    chips: chips.slice(0, 2), // Máximo 2 chips
  };
};

// Ordenar empresas por prioridade
export const ordenarPorPrioridade = (empresas: Empresa[]): PrioridadeItem[] => {
  return empresas
    .map(gerarPrioridadeItem)
    .sort((a, b) => b.score - a.score);
};

type ContactCandidate = { id?: string; nome?: string | null; email?: string | null; whatsapp?: string | null; contato_principal?: boolean | null };

export type BoletoContactEmpresa = {
  razao_social: string;
  email?: string | null;
  email_financeiro?: string | null;
  whatsapp?: string | null;
  responsaveis?: ContactCandidate[];
  colaboradores?: ContactCandidate[];
};

export function chooseBoletoContact(empresa: BoletoContactEmpresa) {
  const responsaveis = empresa.responsaveis ?? [];
  const principal = responsaveis.find((responsavel) => responsavel.contato_principal);
  const candidates = [
    ...(principal ? [principal] : []),
    ...(empresa.colaboradores ?? []),
    ...responsaveis.filter((responsavel) => responsavel !== principal),
    { nome: empresa.razao_social, email: empresa.email, whatsapp: empresa.whatsapp },
  ].map((candidate) => ({
    nome: candidate.nome?.trim() || undefined,
    email: candidate.email?.trim() || undefined,
    whatsapp: candidate.whatsapp?.trim() || undefined,
  }));
  const withBoth = candidates.find((candidate) => candidate.email && candidate.whatsapp);
  const contato = withBoth ?? {
    nome: candidates.find((candidate) => candidate.nome)?.nome ?? empresa.razao_social,
    email: candidates.find((candidate) => candidate.email)?.email,
    whatsapp: candidates.find((candidate) => candidate.whatsapp)?.whatsapp,
  };
  return { ...contato, email: empresa.email_financeiro?.trim() || contato.email };
}

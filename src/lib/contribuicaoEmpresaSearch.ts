export interface EmpresaContribuicaoOption {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
}

const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();

export function filterEmpresasContribuicao<T extends EmpresaContribuicaoOption>(empresas: T[], search: string): T[] {
  const terms = normalize(search).split(/\s+/).filter(Boolean);
  const digits = search.replace(/\D/g, "");
  const isDocumentSearch = digits.length > 0 && /^[\d\s./-]+$/.test(search.trim());
  return empresas.filter((empresa) => {
    if (isDocumentSearch) return empresa.cnpj.replace(/\D/g, "").includes(digits);
    const text = normalize(`${empresa.razaoSocial} ${empresa.nomeFantasia} ${empresa.cnpj}`);
    return terms.every((term) => text.includes(term));
  }).sort((a, b) => a.razaoSocial.localeCompare(b.razaoSocial, "pt-BR", { sensitivity: "base" }) || a.id.localeCompare(b.id));
}

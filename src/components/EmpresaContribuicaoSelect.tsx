import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { EmpresaContribuicaoOption, filterEmpresasContribuicao } from "@/lib/contribuicaoEmpresaSearch";

export function EmpresaContribuicaoLabel({ empresa }: { empresa: EmpresaContribuicaoOption }) {
  return <span className="flex min-w-0 flex-col text-left">
    <span className="whitespace-normal font-medium">{empresa.razaoSocial}</span>
    {empresa.nomeFantasia.trim() && <span className="whitespace-normal text-xs text-muted-foreground">{empresa.nomeFantasia}</span>}
    {empresa.cnpj && <span className="text-xs text-muted-foreground">{empresa.cnpj}</span>}
  </span>;
}

export function EmpresaContribuicaoSelect({ empresas, value, onChange }: {
  empresas: EmpresaContribuicaoOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => filterEmpresasContribuicao(empresas, search), [empresas, search]);
  const selected = empresas.find((empresa) => empresa.id === value);
  return <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setSearch(""); }}>
    <PopoverTrigger asChild>
      <Button type="button" variant="outline" role="combobox" aria-label="Adicionar empresa da lista" aria-expanded={open} className="h-auto min-h-10 w-full justify-between gap-2 py-2">
        {selected ? <EmpresaContribuicaoLabel empresa={selected} /> : "Selecione uma empresa"}
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
      <Command shouldFilter={false}>
        <CommandInput placeholder="Buscar razão social, nome fantasia ou CNPJ" value={search} onValueChange={setSearch} />
        <CommandList>
          <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
          {filtered.map((empresa) => <CommandItem key={empresa.id} value={empresa.id} onSelect={() => { onChange(empresa.id); setOpen(false); setSearch(""); }} className="gap-2 py-2">
            <Check className={`h-4 w-4 shrink-0 ${value === empresa.id ? "opacity-100" : "opacity-0"}`} />
            <EmpresaContribuicaoLabel empresa={empresa} />
          </CommandItem>)}
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>;
}

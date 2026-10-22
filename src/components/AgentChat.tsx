import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { getIntelligenceApiUrl } from "@/lib/env";
import { AgentHistory, AgentProposal, intelligenceRequest } from "@/lib/api/intelligence";

const statusLabel: Record<string, string> = {
  pending: "Aguardando sua confirmação • válida por 30 minutos", executed: "Alteração concluída",
  rejected: "Proposta recusada", expired: "Proposta expirada", failed: "Alteração não concluída",
  uncertain: "Resultado incerto: confira o registro antes de tentar novamente", executing: "Execução em andamento; não repita",
};
const show = (value: unknown) => value == null ? "Não preenchido" : typeof value === "object" ? JSON.stringify(value) : String(value);

export function AgentChat() {
  const { token } = useAuth();
  const location = useLocation();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const retry = useRef<{ id: string; text: string } | null>(null);
  const queryKey = ["agent-history", token];
  const history = useQuery({ queryKey, enabled: open && !!token && !!getIntelligenceApiUrl(), queryFn: () => intelligenceRequest<AgentHistory>("/agent/history", token!), refetchInterval: open ? 30000 : false });
  useEffect(() => { setOpen(false); setText(""); setError(""); retry.current = null; }, [token]);
  if (!token || !getIntelligenceApiUrl() || !location.pathname.startsWith("/dashboard")) return null;

  const send = async () => {
    if (lock.current || !text.trim()) return;
    lock.current = true;
    setBusy(true);
    setError("");
    const request = retry.current?.text === text.trim() ? retry.current : { id: crypto.randomUUID(), text: text.trim() };
    retry.current = request;
    try {
      await intelligenceRequest("/agent/chat", token, "POST", { request_id: request.id, message: request.text });
      retry.current = null;
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar. Tente novamente com a mesma mensagem para consultar a solicitação existente.");
    } finally {
      await history.refetch();
      setBusy(false);
      lock.current = false;
    }
  };
  const decide = async (proposal: AgentProposal, approve: boolean) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await intelligenceRequest(`/agent/proposals/${proposal.id}/decision`, token, "POST", { approve });
      await client.invalidateQueries({ predicate: (query) => query.queryKey[0] !== "agent-history" });
    } catch (err) { setError(err instanceof Error ? err.message : "Confira o registro antes de tentar novamente."); }
    finally { await history.refetch(); lock.current = false; setBusy(false); }
  };
  return <div className="fixed bottom-5 right-5 z-50">
    {!open ? <Button onClick={() => setOpen(true)} className="gap-2 rounded-full shadow-lg"><Bot className="h-5 w-5" />Assistente IA</Button> :
      <section aria-label="Assistente IA" className="flex h-[min(720px,85dvh)] w-[min(440px,calc(100vw-40px))] flex-col rounded-xl border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b p-3"><div><h2 className="font-semibold">Assistente SindRoupas</h2><p className="text-xs text-muted-foreground">{history.data ? `${history.data.quota.remaining} de 3 solicitações disponíveis hoje` : "3 solicitações por dia por usuário"}</p></div><Button size="icon" variant="ghost" aria-label="Fechar assistente" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button></div>
        <div className="flex-1 space-y-4 overflow-y-auto p-3 text-sm" aria-live="polite">
          <p className="text-muted-foreground">Consulte dados e solicite cadastros ou correções. Criações e edições só são executadas quando você confirmar a proposta abaixo.</p>
          {(history.data?.items ?? []).map((item) => <div key={item.request_id} className="space-y-2">
            <p className="whitespace-pre-wrap rounded-lg bg-primary/10 p-2">{item.message}</p>
            <p className="whitespace-pre-wrap">{item.answer}</p>
            {item.proposals.map((proposal) => <div key={proposal.id} className="space-y-2 rounded-lg border p-3">
              <p className="font-medium">{proposal.action === "create" ? "Criar" : "Editar"}: {proposal.entity}</p><p>{proposal.summary}</p>
              {proposal.before?.id != null && <p className="break-all text-xs text-muted-foreground">Registro: {show(proposal.before.id)}</p>}
              <dl className="space-y-2">{Object.entries(proposal.values).map(([key, value]) => <div key={key} className="break-words"><dt className="font-medium">{key}</dt>{proposal.action === "update" && <dd className="text-muted-foreground">Antes: {show(proposal.before?.[key])}</dd>}<dd>Depois: {show(value)}</dd></div>)}</dl>
              <p className="text-xs text-muted-foreground">{statusLabel[proposal.status] || proposal.status}</p>
              {proposal.result?.error && <p className="text-xs text-destructive">{proposal.result.error}</p>}
              {proposal.status === "pending" && <div className="flex gap-2"><Button size="sm" disabled={busy} onClick={() => void decide(proposal, true)}>Confirmar {proposal.action === "create" ? "criação" : "edição"}</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => void decide(proposal, false)}>Recusar</Button></div>}
            </div>)}
          </div>)}
          {busy && <p role="status">Processando… Aguarde antes de enviar outra solicitação.</p>}
          {(error || history.error) && <p role="alert" className="text-destructive">{error || (history.error as Error).message}</p>}
        </div>
        <div className="space-y-2 border-t p-3"><Textarea aria-label="Mensagem para o assistente" placeholder="Ex.: encontre a empresa pelo CNPJ e corrija o e-mail financeiro…" maxLength={5000} value={text} onChange={(event) => setText(event.target.value)} disabled={busy} /><Button className="w-full" disabled={busy || !text.trim() || !history.data || history.data.quota.remaining === 0} onClick={() => void send()}>Enviar solicitação</Button><p className="text-xs text-muted-foreground">Confirmações não consomem a cota. Renovação à meia-noite de Fortaleza.</p></div>
      </section>}
  </div>;
}

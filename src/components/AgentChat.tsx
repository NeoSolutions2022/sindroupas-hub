import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { VoiceMessageInput } from "@/components/VoiceMessageInput";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Trash2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { getIntelligenceApiUrl } from "@/lib/env";
import { AgentHistory, AgentProposal, intelligenceRequest, isIntelligenceAccessError } from "@/lib/api/intelligence";

const statusLabel: Record<string, string> = {
  pending: "Aguardando sua confirmação • válida por 30 minutos", executed: "Alteração concluída",
  rejected: "Proposta recusada", expired: "Proposta expirada", failed: "Alteração não concluída",
  uncertain: "Resultado incerto: confira o registro antes de tentar novamente", executing: "Execução em andamento; não repita",
};
const show = (value: unknown) => value == null ? "Não preenchido" : typeof value === "object" ? JSON.stringify(value) : String(value);

export function AgentChat() {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clearOpen, setClearOpen] = useState(false);
  const lock = useRef(false);
  const retry = useRef<{ id: string; text: string } | null>(null);
  const queryKey = ["agent-history", token];
  const history = useQuery({ queryKey, enabled: open && !!token && !!getIntelligenceApiUrl(), queryFn: () => intelligenceRequest<AgentHistory>("/agent/history", token!),
    retry: (count, err) => !isIntelligenceAccessError(err) && count < 2,
    refetchInterval: (query) => open && !isIntelligenceAccessError(query.state.error) ? 30000 : false,
    refetchOnWindowFocus: (query) => !isIntelligenceAccessError(query.state.error),
    refetchOnReconnect: (query) => !isIntelligenceAccessError(query.state.error) });
  useEffect(() => { setOpen(false); setClearOpen(false); setText(""); setError(""); retry.current = null; }, [token]);
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
  const clearHistory = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await intelligenceRequest("/agent/history/clear", token, "POST");
      retry.current = null;
      setText("");
      await history.refetch();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível limpar o histórico."); }
    finally { lock.current = false; setBusy(false); }
  };
  return <div className="fixed bottom-5 right-5 z-50">
    {!open ? <Button onClick={() => setOpen(true)} className="gap-2 rounded-full bg-[#183e35] text-white shadow-lg hover:bg-[#285344]"><Bot className="h-5 w-5" />Assistente IA</Button> :
      <section aria-label="Assistente IA" className="flex h-[min(720px,85dvh)] w-[min(440px,calc(100vw-40px))] flex-col overflow-hidden rounded-2xl border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b bg-[#eef2e6] p-4"><div><h2 className="font-semibold">Assistente SindRoupas</h2><p className="mt-1 text-xs text-muted-foreground">{history.data ? `${history.data.quota.remaining} de ${history.data.quota.limit} solicitações disponíveis hoje` : "8 solicitações por dia por usuário"}</p></div><div className="flex"><Button size="icon" variant="ghost" aria-label="Limpar histórico do chat" title="Limpar histórico do chat" disabled={busy || !history.data?.items.length} onClick={() => setClearOpen(true)}><Trash2 className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Fechar assistente" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button></div></div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm" aria-live="polite">
          <div className="rounded-xl border bg-muted/30 p-3"><p className="font-medium">Como posso ajudar?</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Consulte dados, prepare boletos para revisão ou proponha correções. Nada é criado ou alterado sem sua confirmação.</p>{!history.data?.items.length && <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={() => setText("Quero consultar os dados de uma empresa.")}>Consultar empresa</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => setText("Quero preparar um boleto para revisar antes de emitir.")}>Preparar boleto</Button></div>}</div>
          {(history.data?.items ?? []).map((item) => <div key={item.request_id} className="space-y-2">
            <p className="whitespace-pre-wrap rounded-lg bg-primary/10 p-2">{item.message}</p>
            <div className="prose prose-sm max-w-none break-words dark:prose-invert prose-headings:mb-2 prose-headings:mt-4 prose-p:my-2 prose-a:text-primary prose-pre:max-w-full prose-pre:overflow-x-auto" data-testid="agent-answer"><ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{
              a: ({ href, children }) => href && /^https?:\/\//i.test(href) ? <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> : <span>{children}</span>,
              img: ({ alt }) => <span>{alt}</span>,
              table: ({ children }) => <div className="max-w-full overflow-x-auto"><table>{children}</table></div>,
            }}>{item.answer}</ReactMarkdown></div>
            {(item.actions ?? []).filter((action) => action.kind === "boleto_form").map((action) => <div key={action.id} className="space-y-2 rounded-lg border p-3"><p className="font-medium">Preparar boleto: {action.empresa_nome}</p><p className="text-xs text-muted-foreground">{action.tipo} • {action.periodicidade || "Revisar período"}{action.competencia ? ` • ${action.competencia}` : ""}. Nenhum boleto foi emitido. Confira empresa, vínculo, valor, competência e vencimento no formulário.</p><Button size="sm" disabled={busy} onClick={() => { navigate("/dashboard/financeiro", { state: { agentBoletoDraft: { ...action, navigationId: crypto.randomUUID() } } }); setOpen(false); }}>Abrir formulário para revisar</Button></div>)}
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
        <div className="space-y-2 border-t p-3"><VoiceMessageInput disabled={busy} onTranscript={(transcript) => setText((previous) => `${previous.trim()} ${transcript}`.trim().slice(0, 5000))} /><Textarea aria-label="Mensagem para o assistente" placeholder="Ex.: prepare a mensalidade da empresa Alfa para eu revisar…" maxLength={5000} value={text} onChange={(event) => setText(event.target.value)} disabled={busy} /><Button className="w-full" disabled={busy || !text.trim() || !history.data || history.data.quota.remaining === 0} onClick={() => void send()}>Enviar solicitação</Button><p className="text-xs text-muted-foreground">Confirmações não consomem a cota. Renovação à meia-noite de Fortaleza.</p></div>
      </section>}
    <AlertDialog open={clearOpen} onOpenChange={setClearOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Limpar histórico do chat?</AlertDialogTitle><AlertDialogDescription>As conversas sairão da tela e não serão usadas nas próximas respostas. Propostas pendentes serão recusadas. A auditoria das ações e as solicitações já usadas hoje serão preservadas. Nenhum dado de empresa ou boleto será alterado.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => void clearHistory()}>Confirmar limpeza</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

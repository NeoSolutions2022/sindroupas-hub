import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { getIntelligenceApiUrl } from "@/lib/env";
import { intelligenceRequest, isIntelligenceAccessError, NewsletterEdition, NewsletterSettings, NewsletterState } from "@/lib/api/intelligence";
import { useToast } from "@/hooks/use-toast";
import { NewsletterCardPreview } from "@/components/NewsletterCardPreview";

const initialSettings: NewsletterSettings = { enabled: false, time: "09:00", destination_type: "number", number: "", cta_label: "Fale com o SindRoupas", cta_url: "", source_links: [], notes: "", photo_url: "", photo_urls: [], photo_caption: "", images_enabled: false };
const statuses: Record<string, string> = { ready: "Pronta", generating: "Pesquisando e gerando…", failed: "Falha na geração", sent: "Enviada", sending: "Enviando…", uncertain: "Conferir envio no WhatsApp" };

export default function Newsletter() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [draft, setDraft] = useState<NewsletterSettings | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<{ action: "generate" | "send" | "retry" | "images"; edition?: NewsletterEdition } | null>(null);
  const lock = useRef(false);
  const configured = !!getIntelligenceApiUrl();
  const state = useQuery({ queryKey: ["newsletter", token], enabled: !!token && configured, queryFn: () => intelligenceRequest<NewsletterState>("/newsletter", token!),
    retry: (count, err) => !isIntelligenceAccessError(err) && count < 2,
    refetchInterval: (query) => isIntelligenceAccessError(query.state.error) ? false : 10000,
    refetchOnWindowFocus: (query) => !isIntelligenceAccessError(query.state.error),
    refetchOnReconnect: (query) => !isIntelligenceAccessError(query.state.error) });
  useEffect(() => { if (state.data && !draft) setDraft({ ...initialSettings, ...state.data.settings }); }, [state.data, draft]);
  useEffect(() => { setDraft(null); setError(""); setGroups([]); }, [token]);
  const form = draft ?? initialSettings;
  const update = <K extends keyof NewsletterSettings>(key: K, value: NewsletterSettings[K]) => setDraft((previous) => ({ ...initialSettings, ...previous, [key]: value }));

  const run = async (action: () => Promise<unknown>, message: string) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try { await action(); toast({ title: message }); await state.refetch(); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível concluir a operação."); }
    finally { setBusy(false); lock.current = false; }
  };
  const confirm = () => {
    if (!confirmation) return;
    const { action, edition } = confirmation;
    setConfirmation(null);
    void run(async () => {
      const result = await intelligenceRequest<{ status?: string; error?: string }>(action === "generate" ? "/newsletter/generate" : `/newsletter/${edition!.id}/${action}`, token!, "POST");
      if (result.status === "uncertain") throw new Error(result.error || "Confira o WhatsApp antes de tentar qualquer reenvio.");
    }, action === "images" ? "Imagens prontas. Abra os cards no histórico." : action === "send" ? "Envio registrado. Confira a situação no histórico." : "Geração solicitada. Se a edição já está pronta, ela foi mantida; use Gerar imagens desta edição para adicionar cards.");
  };

  return <SidebarProvider><div className="flex min-h-screen w-full"><AppSidebar /><div className="min-w-0 flex-1"><DashboardNavbar /><main className="space-y-6 p-4 md:p-8">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold">Radar Moda • Newsletter</h1><p className="text-sm text-muted-foreground">Curadoria semanal de moda, indústria e consumo. Quartas-feiras, no horário de Fortaleza.</p></div><Button disabled={!state.data || busy || state.data.editions.some((edition) => edition.status === "generating")} onClick={() => setConfirmation({ action: "generate" })}>Gerar edição da semana</Button></div>
    {!configured && <p role="status" className="rounded-lg border bg-muted p-4">O serviço de newsletter e assistente ainda não foi conectado a este ambiente. Configure VITE_INTELLIGENCE_API_URL após publicar o serviço de inteligência.</p>}
    {(error || state.error) && <p role="alert" className="rounded-lg border border-destructive p-3 text-destructive">{error || (state.error as Error).message}</p>}
    {state.data && <p className="text-xs text-muted-foreground">Modelo: {state.data.model || "gpt-6.1-sol"} • Histórico centralizado no PostgreSQL do Hasura.</p>}
    {(state.data?.jobs ?? []).filter((job) => job.status !== "done").map((job) => <p key={job.id} role="status" className="rounded-lg border bg-muted/20 p-3 text-sm">{({ pending: "Geração na fila", running: "Pesquisando notícias e preparando a edição", blocked: "Geração aguardando configuração", failed: "Geração não concluída" } as Record<string, string>)[job.status] || job.status}{job.error ? `: ${job.error}` : ". O resultado aparecerá no histórico."}</p>)}
    <Card><CardHeader><CardTitle>Configuração da newsletter</CardTitle></CardHeader><CardContent className="space-y-5">
      <div className="flex flex-wrap items-center gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.enabled} disabled={!draft || busy} onChange={(event) => update("enabled", event.target.checked)} />Gerar automaticamente toda quarta-feira</label><div className="flex items-center gap-2"><Label htmlFor="newsletter-time">Horário</Label><Input id="newsletter-time" type="time" className="w-32" value={form.time} onChange={(event) => update("time", event.target.value)} disabled={!draft || busy} /></div></div>
      <div className="space-y-1"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.images_enabled} disabled={!draft || busy} onChange={(event) => update("images_enabled", event.target.checked)} />Gerar versão em imagens para WhatsApp</label><p className="text-xs text-muted-foreground">Monta cards PNG com o mesmo conteúdo e as fontes da edição. O texto com links acompanha o envio e as imagens ficam no histórico.</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="newsletter-sources">Links de fontes adicionais</Label><Textarea id="newsletter-sources" placeholder="https://… (um link por linha)" value={form.source_links.join("\n")} onChange={(event) => update("source_links", event.target.value.split("\n"))} disabled={!draft || busy} /><p className="text-xs text-muted-foreground">Sugestões para a pesquisa. Datas, fontes e ineditismo continuam sendo verificados.</p></div>
        <div className="space-y-2"><Label htmlFor="newsletter-notes">Notícias, pautas e orientações da edição</Label><Textarea id="newsletter-notes" maxLength={6000} value={form.notes} onChange={(event) => update("notes", event.target.value)} disabled={!draft || busy} /></div>
        <div className="space-y-2"><Label htmlFor="newsletter-photos">Fotos (links HTTPS, até 5)</Label><Textarea id="newsletter-photos" placeholder="https://… (uma foto por linha)" value={(form.photo_urls ?? []).join("\n")} onChange={(event) => update("photo_urls", event.target.value.split("\n"))} disabled={!draft || busy} /></div>
        <div className="space-y-2"><Label htmlFor="newsletter-photo-caption">Legenda das fotos</Label><Textarea id="newsletter-photo-caption" maxLength={1000} value={form.photo_caption} onChange={(event) => update("photo_caption", event.target.value)} disabled={!draft || busy} /></div>
        <div className="space-y-2"><Label htmlFor="newsletter-cta-label">Texto do CTA de contato</Label><Input id="newsletter-cta-label" maxLength={100} value={form.cta_label} onChange={(event) => update("cta_label", event.target.value)} disabled={!draft || busy} /></div>
        <div className="space-y-2"><Label htmlFor="newsletter-cta-url">Link de contato do CTA</Label><Input id="newsletter-cta-url" placeholder="https://wa.me/55…" value={form.cta_url} onChange={(event) => update("cta_url", event.target.value)} disabled={!draft || busy} /></div>
      </div>
      <div className="space-y-3 rounded-lg border p-4"><h2 className="font-medium">Recebimento no WhatsApp</h2><p className="text-sm text-muted-foreground">Usa a instância Evolution configurada no serviço. Sem destino, a edição fica apenas no histórico da plataforma.</p>
        <div className="flex flex-wrap gap-4"><label className="flex items-center gap-2 text-sm"><input type="radio" name="newsletter-destination" checked={form.destination_type === "number"} onChange={() => { update("destination_type", "number"); update("number", ""); }} disabled={!draft || busy} />Número individual</label><label className="flex items-center gap-2 text-sm"><input type="radio" name="newsletter-destination" checked={form.destination_type === "group"} onChange={() => { update("destination_type", "group"); update("number", ""); }} disabled={!draft || busy} />Grupo</label></div>
        <Label htmlFor="newsletter-number">{form.destination_type === "group" ? "ID do grupo (…@g.us)" : "Número com DDD"}</Label><Input id="newsletter-number" value={form.number} onChange={(event) => update("number", event.target.value)} placeholder={form.destination_type === "group" ? "120…@g.us" : "(85) 99999-9999"} disabled={!draft || busy} />
        {form.destination_type === "group" && <div className="space-y-2"><Button variant="outline" disabled={!draft || busy} onClick={() => void run(async () => setGroups(await intelligenceRequest("/newsletter/groups", token!)), "Grupos carregados.")}>Carregar grupos da Evolution</Button>{groups.length > 0 && <select aria-label="Selecionar grupo Evolution" className="w-full rounded-md border bg-background p-2" value={form.number} onChange={(event) => update("number", event.target.value)}><option value="">Selecione um grupo</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select>}</div>}
      </div>
      <Button disabled={!draft || busy} onClick={() => void run(async () => {
        const normalized = { ...form, source_links: form.source_links.map((link) => link.trim()).filter(Boolean), photo_urls: (form.photo_urls ?? []).map((link) => link.trim()).filter(Boolean) };
        const saved = await intelligenceRequest<NewsletterSettings>("/newsletter/settings", token!, "PUT", normalized);
        setDraft({ ...initialSettings, ...saved });
      }, "Configuração salva.")}>Salvar configuração</Button>
      {form.cta_url.startsWith("https://") && <div className="rounded-lg border bg-muted/20 p-4 text-center"><p className="mb-2 text-xs text-muted-foreground">Prévia do contato da newsletter</p><a className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href={form.cta_url} target="_blank" rel="noopener noreferrer">{form.cta_label || "Entrar em contato"}</a></div>}
    </CardContent></Card>
    <div className="space-y-4"><h2 className="text-lg font-semibold">Histórico das edições</h2>{state.data?.editions.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma edição gerada ainda.</p>}
      {state.data?.editions.map((edition) => <Card key={edition.id}><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="text-base">{edition.period_start.split("-").reverse().join("/")} → {edition.period_end.split("-").reverse().join("/")}</CardTitle><Badge variant={edition.status === "failed" ? "destructive" : "secondary"}>{statuses[edition.status]}</Badge></div></CardHeader><CardContent className="space-y-3">
        {edition.error && <p className="text-sm text-destructive">{edition.error}</p>}
        {(edition.media ?? []).length > 0 && <div className="flex flex-wrap gap-3">{edition.media!.map((photo, index) => <a key={`${photo.url}-${index}`} href={photo.url} target="_blank" rel="noopener noreferrer" className="text-sm underline">Foto {index + 1}{photo.caption ? `: ${photo.caption}` : ""}</a>)}</div>}
        {(edition.image_assets ?? []).length > 0 && <div className="space-y-2"><p className="text-sm font-medium">Versão em imagens</p><div className="flex flex-wrap gap-2">{edition.image_assets!.map((asset) => <NewsletterCardPreview key={asset.id} id={asset.id} token={token!} caption={`Card ${asset.position + 1}`} />)}</div></div>}
        {edition.content && <details><summary className="cursor-pointer text-sm font-medium">Abrir newsletter</summary><p className="mt-3 whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-sm">{edition.content}</p><ul className="mt-3 space-y-1 text-sm">{edition.articles.map((article) => <li key={article.url}><a className="underline" href={article.url} target="_blank" rel="noopener noreferrer">{article.title}</a> <span className="text-xs text-muted-foreground">{article.published_at}</span></li>)}</ul></details>}
        {edition.deliveries.map((delivery) => <p key={delivery.id} className="text-xs text-muted-foreground">{statuses[delivery.status] || delivery.status} • {delivery.number}{delivery.error ? ` • ${delivery.error}` : ""}</p>)}
        {edition.status === "ready" && !(edition.image_assets ?? []).length && <div className="space-y-2 rounded-md border p-3"><p className="text-sm text-muted-foreground">Esta edição foi gerada somente em texto. Adicione os cards sem refazer a pesquisa nem reenviar mensagens.</p><Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirmation({ action: "images", edition })}>{busy ? "Aguarde…" : "Gerar imagens desta edição"}</Button></div>}
        <div className="flex flex-wrap gap-2">{edition.content && <Button size="sm" variant="outline" onClick={() => void run(() => navigator.clipboard.writeText(edition.content!), "Newsletter copiada.")}>Copiar para WhatsApp</Button>}{edition.status === "ready" && <Button size="sm" disabled={busy || !state.data.settings.number} onClick={() => setConfirmation({ action: "send", edition })}>Enviar ao destino cadastrado</Button>}{edition.status === "failed" && <Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirmation({ action: "retry", edition })}>Tentar gerar novamente</Button>}</div>
      </CardContent></Card>)}
    </div>
    <AlertDialog open={!!confirmation} onOpenChange={(open) => !open && setConfirmation(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirmation?.action === "images" ? "Gerar imagens desta edição?" : confirmation?.action === "send" ? "Enviar newsletter?" : "Gerar newsletter desta semana?"}</AlertDialogTitle><AlertDialogDescription>{confirmation?.action === "images" ? "Os cards usarão as notícias, fontes e síntese já salvas nesta edição. O texto será preservado, sem nova pesquisa ou cobrança de geração OpenAI. Nenhuma mensagem será enviada ao WhatsApp; envios anteriores não serão repetidos." : confirmation?.action === "send" ? `Enviar a edição ao destino ${state.data?.settings.number}. Envios já registrados para esse destino não serão duplicados.` : `A pesquisa usará notícias atuais e o histórico das edições. ${state.data?.settings.number ? `Quando pronta, será enviada automaticamente para ${state.data.settings.number}.` : "Sem destino cadastrado, ficará apenas no histórico."} Será mantida uma edição por semana. São usadas as configurações salvas.`}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirm}>Confirmar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main></div></div></SidebarProvider>;
}

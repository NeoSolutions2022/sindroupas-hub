import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { intelligenceImage } from "@/lib/api/intelligence";

export function NewsletterCardPreview({ id, caption, token }: { id: string; caption: string; token: string }) {
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => { setOpen(false); setUrl(""); }, [token]);
  const preview = async () => {
    if (busy) return;
    setBusy(true); setError("");
    try {
      if (!url) setUrl(URL.createObjectURL(await intelligenceImage(id, token)));
      setOpen(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Falha ao carregar card."); }
    finally { setBusy(false); }
  };
  return <div><Button size="sm" variant="outline" disabled={busy} onClick={() => void preview()}>{busy ? "Carregando…" : caption}</Button>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{caption}</DialogTitle></DialogHeader>{url && <><img className="h-auto w-full" src={url} alt={caption} /><a className="text-center text-sm underline" href={url} download={`radar-moda-${id}.png`}>Baixar imagem PNG</a></>}</DialogContent></Dialog>
  </div>;
}

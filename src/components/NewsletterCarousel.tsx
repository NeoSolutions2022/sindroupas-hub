import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { intelligenceImage, NewsletterEdition } from "@/lib/api/intelligence";

function CardImage({ asset, token, visible, selected }: { asset: NonNullable<NewsletterEdition["image_assets"]>[number]; token: string; visible: boolean; selected: boolean }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let active = true;
    let objectUrl = "";
    setError("");
    void intelligenceImage(asset.id, token).then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob); setUrl(objectUrl);
    }).catch((err) => { if (active) setError(err instanceof Error ? err.message : "Não foi possível abrir o card."); });
    return () => { active = false; setUrl(""); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [asset.id, token, visible, attempt]);
  return <div className="space-y-3"><div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg bg-[#e6e9de] shadow-md">{error ? <div role="alert" className="space-y-3 p-4 text-center text-xs"><p>{error}</p><Button size="sm" variant="outline" onClick={() => setAttempt((value) => value+1)}>Tentar novamente</Button></div> : url ? <img src={url} alt={asset.caption} className="h-full w-full object-contain" /> : <Loader2 aria-label="Carregando card" className="h-6 w-6 animate-spin text-[#526d50]" />}</div>{selected && <div className="flex min-h-8 justify-end">{url && <a href={url} download={`radar-moda-${asset.position+1}.png`} className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs font-medium hover:bg-muted"><Download className="h-3.5 w-3.5" />Baixar card</a>}</div>}</div>;
}

export function NewsletterCarousel({ assets, token }: { assets: NonNullable<NewsletterEdition["image_assets"]>; token: string }) {
  const [ref, api] = useEmblaCarousel({ align: "center", containScroll: false });
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!api) return;
    const update = () => setIndex(api.selectedScrollSnap());
    update(); api.on("select", update); api.on("reInit", update);
    return () => { api.off("select", update); api.off("reInit", update); };
  }, [api]);
  return <section aria-label="Carrossel da newsletter" aria-roledescription="carrossel" tabIndex={0} onKeyDown={(event) => { if (event.key === "ArrowRight") { event.preventDefault(); api?.scrollNext(); } if (event.key === "ArrowLeft") { event.preventDefault(); api?.scrollPrev(); } }} className="relative rounded-xl bg-[#f6f5ef] pb-5 pt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <div className="overflow-hidden" ref={ref}><div className="flex touch-pan-y">{assets.map((asset, position) => <div key={asset.id} role="group" aria-label={`Card ${position+1} de ${assets.length}`} className={`min-w-0 shrink-0 grow-0 basis-[82%] px-2 transition-transform duration-300 sm:basis-[58%] ${position === index ? "scale-100" : "scale-[.9] opacity-70"}`}><CardImage asset={asset} token={token} selected={position === index} visible={Math.abs(position-index) <= 1} /></div>)}</div></div>
    <Button size="icon" variant="secondary" className="absolute left-2 top-[45%] rounded-full border shadow-sm" aria-label="Card anterior" disabled={index === 0} onClick={() => api?.scrollPrev()}><ChevronLeft className="h-5 w-5" /></Button><Button size="icon" variant="secondary" className="absolute right-2 top-[45%] rounded-full border shadow-sm" aria-label="Próximo card" disabled={index === assets.length-1} onClick={() => api?.scrollNext()}><ChevronRight className="h-5 w-5" /></Button>
    <div className="mt-4 flex flex-wrap items-center justify-center gap-1" aria-label="Escolher card">{assets.map((asset, position) => <button key={asset.id} type="button" aria-label={`Card ${position+1}`} aria-pressed={position === index} onClick={() => api?.scrollTo(position)} className="flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className={`h-2 w-2 rounded-full ${position === index ? "bg-[#183e35]" : "bg-[#d1d6c8]"}`} /></button>)}</div><p aria-live="polite" className="text-center text-xs text-muted-foreground">{index+1} de {assets.length} · Arraste ou use as setas</p>
  </section>;
}

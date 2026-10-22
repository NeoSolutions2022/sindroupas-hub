import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null; start(): void; stop(): void; abort(): void;
};
type VoiceWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

export function VoiceMessageInput({ disabled, onTranscript }: { disabled: boolean; onTranscript: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recognition = useRef<Recognition | null>(null);
  const supported = typeof window !== "undefined" && !!((window as VoiceWindow).SpeechRecognition || (window as VoiceWindow).webkitSpeechRecognition);
  useEffect(() => () => { if (recognition.current) { recognition.current.onend = null; recognition.current.onresult = null; recognition.current.onerror = null; recognition.current.abort(); } }, []);
  const start = () => {
    if (listening) { recognition.current?.stop(); return; }
    const Constructor = (window as VoiceWindow).SpeechRecognition || (window as VoiceWindow).webkitSpeechRecognition;
    if (!Constructor) return;
    setError("");
    const instance = new Constructor();
    recognition.current = instance;
    instance.lang = "pt-BR"; instance.continuous = false; instance.interimResults = false;
    instance.onresult = (event) => { const result = Array.from(event.results).map((entry) => entry[0]?.transcript ?? "").join(" ").trim(); if (result) onTranscript(result); };
    instance.onerror = (event) => { setListening(false); setError(event.error === "not-allowed" ? "Permita o microfone no navegador ou digite sua mensagem." : "Não foi possível reconhecer a fala. Tente novamente ou digite."); };
    instance.onend = () => setListening(false);
    try { instance.start(); setListening(true); } catch { setError("Não foi possível iniciar o microfone."); }
  };
  return <div className="space-y-1"><Button type="button" size="sm" variant="outline" disabled={disabled || !supported} onClick={start} aria-pressed={listening}>{listening ? <Square className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}{listening ? "Parar gravação" : "Ditar mensagem"}</Button><p className="text-xs text-muted-foreground">{supported ? "Revise a transcrição antes de enviar. O navegador pode usar seu serviço online de reconhecimento de voz." : "Voz indisponível neste navegador. Você pode digitar normalmente."}</p>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}</div>;
}

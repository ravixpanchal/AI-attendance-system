import { useRef, useState } from "react";
import { api } from "@/lib/api";
import type { ChatMessage } from "@/types";
import { Button, Card, Textarea } from "./ui";
import { Mic } from "lucide-react";

type AIResp = {
  kind: string;
  message: string;
  data?: unknown;
  pending_token?: string;
  proposed_actions?: unknown;
};

export function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask about attendance, trends, or say e.g. “Mark Ravi present on 2025-03-10”. Destructive actions require confirmation.",
    },
  ]);
  const [input, setInput] = useState("");
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(text?: string) {
    const t = text ?? input.trim();
    if (!t || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: t }]);
    setLoading(true);
    try {
      const res = await api<AIResp>("/ai-query", { method: "POST", body: JSON.stringify({ message: t }) });
      if (res.kind === "confirmation_required" && res.pending_token) {
        setPendingToken(res.pending_token);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: res.message + "\n\n[Confirmation required — use buttons below]",
            data: res.proposed_actions,
          },
        ]);
      } else {
        setPendingToken(null);
        const extra = res.data ? "\n\n" + JSON.stringify(res.data, null, 2) : "";
        setMessages((m) => [...m, { role: "assistant", content: res.message + extra }]);
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Error: " + String(e) }]);
    } finally {
      setLoading(false);
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  async function confirm(confirm: boolean) {
    if (!pendingToken) return;
    setLoading(true);
    try {
      const res = await api<{ ok: boolean; message: string }>("/ai-confirm", {
        method: "POST",
        body: JSON.stringify({ token: pendingToken, confirm }),
      });
      setPendingToken(null);
      setMessages((m) => [...m, { role: "assistant", content: res.message }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Error: " + String(e) }]);
    } finally {
      setLoading(false);
    }
  }

  function startVoice() {
    type SpeechRec = new () => { lang: string; start: () => void };
    const SR = (window as unknown as { webkitSpeechRecognition?: SpeechRec }).webkitSpeechRecognition;
    if (!SR) {
      setMessages((m) => [...m, { role: "assistant", content: "Speech recognition not supported in this browser." }]);
      return;
    }
    const r = new SR() as {
      lang: string;
      start: () => void;
      onresult: ((ev: unknown) => void) | null;
    };
    r.lang = "en-US";
    r.onresult = (ev: unknown) => {
      const res = (ev as { results: { [k: number]: { [k: number]: { transcript: string } } } }).results;
      const text = res[0][0].transcript;
      setInput(text);
      void send(text);
    };
    r.start();
  }

  return (
    <div className="w-full max-w-3xl space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">AI assistant</h1>
        <p className="text-sm text-muted-foreground">Natural language queries and guided corrections</p>
      </div>
      <Card className="flex flex-col p-3 sm:p-4 h-[min(70vh,560px)] min-h-[320px]">
        <div className="mb-3 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[min(100%,20rem)] rounded-2xl rounded-br-md bg-primary px-3 py-2.5 text-sm text-primary-foreground shadow-sm sm:max-w-[85%]"
                  : "mr-auto max-w-[min(100%,min(36rem,92vw))] rounded-2xl rounded-bl-md bg-muted px-3 py-2.5 text-sm whitespace-pre-wrap break-words shadow-sm sm:max-w-[90%]"
              }
            >
              {m.content}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        {pendingToken && (
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <Button className="w-full sm:w-auto" onClick={() => confirm(true)}>
              Confirm change
            </Button>
            <Button className="w-full sm:w-auto" variant="outline" onClick={() => confirm(false)}>
              Cancel
            </Button>
          </div>
        )}
        <div className="flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row sm:items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
            disabled={loading}
            rows={3}
            className="min-h-[88px] flex-1 sm:min-h-[72px]"
          />
          <div className="flex shrink-0 gap-2 sm:flex-col">
            <Button className="min-w-0 flex-1 sm:flex-none" onClick={() => send()} disabled={loading}>
              Send
            </Button>
            <Button
              variant="outline"
              className="min-w-[44px] flex-1 sm:flex-none"
              onClick={startVoice}
              title="Voice input"
              type="button"
            >
              <Mic className="mx-auto h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

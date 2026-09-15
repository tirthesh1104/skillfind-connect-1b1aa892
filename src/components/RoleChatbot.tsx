import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Mic, MicOff, Trash2, Sparkles, Volume2, VolumeX, Square } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAiVoice } from "@/hooks/useAiVoice";

type Lang = "mr" | "hi" | "en";
type Msg = { role: "user" | "assistant"; content: string };

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/role-chatbot`;

const TITLE: Record<string, string> = {
  worker: "मित्र Bot — मदत",
  contractor: "AI Assistant",
  admin: "Compliance Bot",
};

const STARTERS: Record<string, string[]> = {
  worker: ["कोणतं काम आहे?", "माझा पगार?", "हजेरी पहा", "मदत हवी आहे"],
  contractor: ["Find 5 welders in Pune", "Is ₹450/day for helper legal?", "How do I generate an appointment letter?", "Show this week's site stats"],
  admin: ["Maharashtra minimum wages (all categories)", "ESIC registration threshold", "Appointment-letter mandatory fields (Labour Code 2025)", "Worker dispute — platform legal obligations"],
};

export const RoleChatbot = ({ role }: { role: "worker" | "contractor" | "admin" }) => {
  const { user } = useAuth();
  const { lang: siteLang } = useLanguage();
  const { speak, stop, speaking } = useAiVoice();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  // Chat language follows the site language switcher by default; user can still override here.
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("chatbot_lang") as Lang) || (siteLang as Lang));
  const [voiceOn, setVoiceOn] = useState(() => localStorage.getItem("chatbot_voice") === "1");
  const [recording, setRecording] = useState(false);
  const [context, setContext] = useState<Record<string, unknown>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<any>(null);

  useEffect(() => { localStorage.setItem("chatbot_lang", lang); }, [lang]);
  useEffect(() => { localStorage.setItem("chatbot_voice", voiceOn ? "1" : "0"); }, [voiceOn]);
  // Keep the chat in sync when the user changes the site language.
  useEffect(() => { setLang(siteLang as Lang); }, [siteLang]);
  useEffect(() => { if (!open) stop(); }, [open, stop]);

  // Build live user context (read-only quick stats) when opened
  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const ctx: Record<string, unknown> = {};
      const { data: prof } = await supabase.from("profiles").select("full_name, location, upi_verified, profile_complete, rating_avg").eq("id", user.id).maybeSingle();
      if (prof) ctx.profile = prof;

      if (role === "worker") {
        const { data: lp } = await supabase.from("labour_profiles").select("skill, price_per_day, experience_years").eq("user_id", user.id).maybeSingle();
        if (lp) ctx.skill_profile = lp;
        const { data: pays } = await supabase.from("labour_payments").select("status, amount, expected_payment_date").eq("labour_id", user.id).order("created_at", { ascending: false }).limit(5);
        ctx.recent_payments = pays ?? [];
        // (applications count omitted — schema-specific join)
      } else if (role === "contractor") {
        const { data: jobs } = await supabase.from("jobs").select("id, title, status").eq("contractor_id", user.id);
        ctx.posted_jobs = jobs?.length ?? 0;
        const { data: pays } = await supabase.from("labour_payments").select("status").eq("contractor_id", user.id);
        ctx.pending_payments = pays?.filter(p => p.status !== "Paid").length ?? 0;
      } else if (role === "admin") {
        const [{ count: workers }, { count: contractors }, { data: disputes }] = await Promise.all([
          supabase.from("labour_profiles").select("*", { count: "exact", head: true }),
          supabase.from("contractor_profiles").select("*", { count: "exact", head: true }),
          supabase.from("disputes").select("status").eq("status", "open"),
        ]);
        ctx.total_workers = workers ?? 0;
        ctx.total_contractors = contractors ?? 0;
        ctx.open_disputes = disputes?.length ?? 0;
      }
      setContext(ctx);
    })();
  }, [open, user, role]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    setBusy(true);

    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ role, language: lang, messages: next, context }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        toast.error(err.error || "AI error");
        setBusy(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      setMessages([...next, { role: "assistant", content: "" }]);

      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const j = JSON.parse(data);
            const delta = j.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages(m => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggleMic = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice not supported on this browser"); return; }
    if (recording) { recogRef.current?.stop(); return; }
    const r = new SR();
    r.lang = lang === "mr" ? "mr-IN" : lang === "hi" ? "hi-IN" : "en-IN";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e: any) => setInput(e.results[0][0].transcript);
    r.onerror = () => setRecording(false);
    r.onend = () => setRecording(false);
    r.start();
    recogRef.current = r;
    setRecording(true);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-glow bg-gradient-primary text-white hover:scale-105 transition-transform animate-pulse"
          aria-label="Open chatbot"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="border-b p-4 space-y-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {TITLE[role]}
            </SheetTitle>
          </div>
          <div className="flex items-center justify-between gap-2">
            {/* Language mode: available for every role. Input accepts Devanagari + Latin freely. */}
            <div className="flex gap-1">
              {(["mr", "hi", "en"] as Lang[]).map(l => (
                <Button key={l} size="sm" variant={lang === l ? "default" : "outline"} onClick={() => setLang(l)} className="h-7 px-2 text-xs">
                  {l === "mr" ? "मराठी" : l === "hi" ? "हिंदी" : "EN"}
                </Button>
              ))}
            </div>
            {messages.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setMessages([])} className="ml-auto h-7 px-2 text-xs">
                <Trash2 className="mr-1 h-3 w-3" /> Clear
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1" ref={scrollRef as any}>
          <div className="p-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center py-4">
                  {role === "worker" && lang === "mr" && "मला विचारा — मी तुमची मदत करेन."}
                  {role === "worker" && lang === "hi" && "मुझसे पूछिए — मैं आपकी मदद करूँगा."}
                  {role === "worker" && lang === "en" && "Ask me anything about your jobs, payments, or profile."}
                  {role === "contractor" && "Ask about workers, payments, compliance, or app workflows."}
                  {role === "admin" && "Ask about Indian labour law, compliance, or platform management."}
                </p>
                <div className="grid gap-2">
                  {STARTERS[role].map(s => (
                    <Button key={s} variant="outline" size="sm" className="justify-start h-auto py-2 text-xs whitespace-normal text-left" onClick={() => send(s)}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "rounded-2xl px-3 py-2 max-w-[85%] text-sm whitespace-pre-wrap break-words",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {m.content || <span className="opacity-60">...</span>}
                </div>
              </div>
            ))}
            {busy && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-3 py-2 bg-muted text-sm">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:240ms]" />
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-3 flex gap-2 items-end">
          <Button size="icon" variant={recording ? "destructive" : "outline"} onClick={toggleMic} title="Voice input">
            {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder={role === "worker" ? (lang === "en" ? "Type your question..." : "इथे लिहा...") : "Ask me..."}
            disabled={busy}
          />
          <Button size="icon" onClick={() => send(input)} disabled={busy || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

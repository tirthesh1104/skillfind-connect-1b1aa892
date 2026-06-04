import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { EmptyState } from "@/components/EmptyState";
import { MessageCircle, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Contact {
  id: string;
  name: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

const Messages = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const initialPeer = params.get("to");
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [activePeer, setActivePeer] = useState<string | null>(initialPeer);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadAll = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: true });
    const msgs = (data ?? []) as Message[];
    setMessages(msgs);

    const peerIds = Array.from(new Set(msgs.map((m) => (m.sender_id === user.id ? m.receiver_id : m.sender_id))));
    if (initialPeer && !peerIds.includes(initialPeer)) peerIds.push(initialPeer);
    if (peerIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", peerIds);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => { map[p.id] = p.full_name || "User"; });
      setProfiles(map);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadAll();
    const ch = supabase
      .channel("messages-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [user?.id]);

  const contacts: Contact[] = useMemo(() => {
    if (!user) return [];
    const map = new Map<string, Contact>();
    for (const m of messages) {
      const peer = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      const existing = map.get(peer);
      const unreadInc = m.receiver_id === user.id && !m.is_read ? 1 : 0;
      if (!existing || new Date(m.created_at) > new Date(existing.lastAt)) {
        map.set(peer, {
          id: peer,
          name: profiles[peer] || "User",
          lastMessage: m.message,
          lastAt: m.created_at,
          unread: (existing?.unread ?? 0) + unreadInc,
        });
      } else {
        existing.unread += unreadInc;
      }
    }
    if (initialPeer && !map.has(initialPeer)) {
      map.set(initialPeer, { id: initialPeer, name: profiles[initialPeer] || "User", lastMessage: "", lastAt: new Date().toISOString(), unread: 0 });
    }
    return Array.from(map.values()).sort((a, b) => +new Date(b.lastAt) - +new Date(a.lastAt));
  }, [messages, profiles, user, initialPeer]);

  const activeMessages = useMemo(() => {
    if (!activePeer || !user) return [];
    return messages.filter(
      (m) => (m.sender_id === user.id && m.receiver_id === activePeer) || (m.sender_id === activePeer && m.receiver_id === user.id)
    );
  }, [messages, activePeer, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    // mark unread received as read
    if (activePeer && user) {
      supabase.from("messages").update({ is_read: true }).eq("sender_id", activePeer).eq("receiver_id", user.id).eq("is_read", false).then(() => {});
    }
  }, [activeMessages.length, activePeer, user]);

  const send = async () => {
    if (!text.trim() || !user || !activePeer) return;
    const msg = text.trim();
    setText("");
    await supabase.from("messages").insert({ sender_id: user.id, receiver_id: activePeer, message: msg });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Messages</h1>
        <p className="text-sm text-muted-foreground">Real-time conversations. Phone numbers stay private.</p>
      </div>

      <div className="glass-card grid h-[70vh] grid-cols-1 overflow-hidden md:grid-cols-[280px_1fr]">
        {/* Contacts */}
        <div className="border-b border-border md:border-b-0 md:border-r">
          <ScrollArea className="h-full">
            {contacts.length === 0 ? (
              <div className="p-6"><EmptyState icon={MessageCircle} title="No conversations" description="Start chatting from a profile or applicant list." /></div>
            ) : (
              <div className="divide-y divide-border">
                {contacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActivePeer(c.id)}
                    className={cn("flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-secondary/50", activePeer === c.id && "bg-secondary")}
                  >
                    <InitialsAvatar name={c.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        {c.unread > 0 && <span className="rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">{c.unread}</span>}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{c.lastMessage || "Say hello"}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat */}
        <div className="flex flex-col">
          {!activePeer ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Select a conversation</div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-border p-3">
                <InitialsAvatar name={profiles[activePeer] || "User"} size="sm" />
                <p className="text-sm font-semibold">{profiles[activePeer] || "User"}</p>
              </div>
              <ScrollArea className="flex-1" ref={scrollRef as any}>
                <div className="space-y-2 p-4">
                  {activeMessages.map((m) => {
                    const mine = m.sender_id === user?.id;
                    return (
                      <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[75%] rounded-2xl px-3 py-2 text-sm", mine ? "bg-gradient-primary text-white" : "bg-secondary")}>
                          <p>{m.message}</p>
                          <p className={cn("mt-1 text-[10px]", mine ? "text-white/70" : "text-muted-foreground")}>
                            {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              <div className="flex gap-2 border-t border-border p-3">
                <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message..." />
                <Button onClick={send} className="bg-gradient-primary"><Send className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;

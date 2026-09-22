import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ListChecks, Plus, Loader2 } from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";

type Task = {
  id: string;
  contractor_id: string;
  worker_id: string;
  task_date: string;
  description: string;
  status: string;
  completed_at: string | null;
};

const today = () => new Date().toISOString().slice(0, 10);

const DailyTasks = () => {
  const { user, role } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<{ id: string; full_name: string }[]>([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);

  const load = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    const col = role === "contractor" ? "contractor_id" : "worker_id";
    const { data } = await supabase
      .from("daily_tasks" as any)
      .select("*")
      .eq(col, user.id)
      .order("task_date", { ascending: false })
      .order("created_at", { ascending: false });
    setTasks((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (role === "contractor" && user) {
      // Load workers this contractor has hired via labour_payments; fallback to all labour profiles
      supabase.from("labour_payments").select("labour_id, profiles:labour_id(full_name)")
        .eq("contractor_id", user.id).then(({ data }) => {
          const seen = new Set<string>();
          const list: { id: string; full_name: string }[] = [];
          (data ?? []).forEach((r: any) => {
            if (r.labour_id && !seen.has(r.labour_id)) {
              seen.add(r.labour_id);
              list.push({ id: r.labour_id, full_name: r.profiles?.full_name ?? "Worker" });
            }
          });
          if (list.length === 0) {
            supabase.from("labour_profiles").select("user_id, profiles:user_id(full_name)").limit(50)
              .then(({ data: lp }) => {
                setWorkers((lp ?? []).map((r: any) => ({ id: r.user_id, full_name: r.profiles?.full_name ?? "Worker" })));
              });
          } else {
            setWorkers(list);
          }
        });
    }
  }, [user, role]);

  const assign = async () => {
    if (!user || !selectedWorker || !desc.trim()) {
      toast.error("Select worker and enter task");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("daily_tasks" as any).insert({
      contractor_id: user.id,
      worker_id: selectedWorker,
      task_date: date,
      description: desc.trim(),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Task assigned");
    setDesc("");
    // notify worker
    await supabase.from("notifications").insert({
      user_id: selectedWorker,
      title: "📋 New task assigned",
      message: desc.trim(),
      type: "system" as const,
    });
    load();
  };

  const toggle = async (t: Task) => {
    const done = t.status !== "completed";
    const { error } = await supabase.from("daily_tasks" as any).update({
      status: done ? "completed" : "pending",
      completed_at: done ? new Date().toISOString() : null,
    }).eq("id", t.id);
    if (error) return toast.error(error.message);
    load();
  };

  // Completion % per worker per day (contractor view)
  const stats = (() => {
    if (role !== "contractor") return null;
    const map: Record<string, { total: number; done: number; name: string }> = {};
    tasks.filter(t => t.task_date === today()).forEach(t => {
      const key = t.worker_id;
      map[key] = map[key] ?? { total: 0, done: 0, name: workers.find(w => w.id === t.worker_id)?.full_name ?? "Worker" };
      map[key].total++;
      if (t.status === "completed") map[key].done++;
    });
    return map;
  })();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <ListChecks className="h-7 w-7 text-primary" /> Daily Tasks / रोजची कामे
        </h1>
        <p className="text-sm text-muted-foreground">
          {role === "contractor" ? "Assign daily tasks to your workers" : "Your tasks for today — mark complete when done"}
        </p>
      </div>

      {role === "contractor" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Assign New Task</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Select value={selectedWorker} onValueChange={setSelectedWorker}>
              <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
              <SelectContent>
                {workers.map(w => <SelectItem key={w.id} value={w.id}>{w.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Textarea
              className="md:col-span-2"
              placeholder="Task description (e.g. Raise wall by 2 feet)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={500}
            />
            <Button onClick={assign} disabled={saving} className="md:col-span-2 bg-gradient-primary">
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              Assign Task
            </Button>
          </CardContent>
        </Card>
      )}

      {role === "contractor" && stats && Object.keys(stats).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Today's Completion %</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats).map(([id, s]) => {
              const pct = Math.round((s.done / s.total) * 100);
              return (
                <div key={id} className="flex items-center gap-3 text-sm">
                  <span className="w-40 truncate">{s.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-20 text-right font-medium">{s.done}/{s.total} · {pct}%</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">{role === "contractor" ? "All Tasks" : "My Tasks"}</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p>
            : tasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks yet.</p>
            : (
              <div className="space-y-2">
                {tasks.map(t => (
                  <div key={t.id} className="flex items-start gap-3 rounded-lg border p-3">
                    {role === "labour" ? (
                      <Checkbox checked={t.status === "completed"} onCheckedChange={() => toggle(t)} className="mt-1" />
                    ) : (
                      <Badge variant={t.status === "completed" ? "default" : "secondary"}>
                        {t.status === "completed" ? "✓" : "•"}
                      </Badge>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${t.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                        {t.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(t.task_date).toLocaleDateString()}
                        {t.completed_at && ` · Completed ${new Date(t.completed_at).toLocaleTimeString()}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyTasks;

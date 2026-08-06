import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Trash2, Youtube } from "lucide-react";
import { toast } from "sonner";

const SKILLS = ["Electrician", "Mason", "Plumber", "Carpenter", "Painter", "Welder", "Helper", "General"];

const AdminSkillBadges = () => {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [form, setForm] = useState({ worker_id: "", skill_name: "Electrician", badge_level: "Verified", note: "" });
  const [vform, setVform] = useState({ title: "", youtube_url: "", skill_category: "Electrician" });

  const load = async () => {
    const [{ data: profs }, { data: b }, { data: v }] = await Promise.all([
      supabase.rpc("admin_list_profiles"),
      supabase.from("worker_skill_badges").select("*").order("certified_at", { ascending: false }),
      supabase.from("training_videos").select("*").order("created_at", { ascending: false }),
    ]);
    setWorkers((profs as any[]) ?? []);
    setBadges(b ?? []);
    setVideos(v ?? []);
  };
  useEffect(() => { load(); }, []);

  const grant = async () => {
    if (!form.worker_id) return toast.error("Select a worker");
    const { error } = await supabase.from("worker_skill_badges").insert({
      worker_id: form.worker_id, skill_name: form.skill_name,
      badge_level: form.badge_level, note: form.note || null, certified_by: user?.id ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success("Badge granted");
    setForm({ ...form, note: "" });
    load();
  };

  const revoke = async (id: string) => {
    const { error } = await supabase.from("worker_skill_badges").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const addVideo = async () => {
    if (!vform.title.trim() || !vform.youtube_url.trim()) return toast.error("Title and URL required");
    const { error } = await supabase.from("training_videos").insert({ ...vform, created_by: user?.id ?? null });
    if (error) return toast.error(error.message);
    toast.success("Video added");
    setVform({ title: "", youtube_url: "", skill_category: vform.skill_category });
    load();
  };

  const removeVideo = async (id: string) => {
    const { error } = await supabase.from("training_videos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const nameOf = (id: string) => workers.find((w) => w.id === id)?.full_name ?? "Worker";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <Award className="h-6 w-6 text-primary" /> Skill Badges & Training
        </h1>
        <p className="text-sm text-muted-foreground">Certify worker skills and manage the Learn video library.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Grant a skill badge</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Worker</Label>
            <Select value={form.worker_id} onValueChange={(v) => setForm({ ...form, worker_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
              <SelectContent>
                {workers.map((w) => <SelectItem key={w.id} value={w.id}>{w.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Skill</Label>
            <Select value={form.skill_name} onValueChange={(v) => setForm({ ...form, skill_name: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SKILLS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Level</Label>
            <Select value={form.badge_level} onValueChange={(v) => setForm({ ...form, badge_level: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Verified">Verified</SelectItem>
                <SelectItem value="Admin-Certified">Admin-Certified</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Note (proof reviewed)</Label>
            <div className="flex gap-2">
              <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="optional" />
              <Button onClick={grant}>Grant</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Granted badges ({badges.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {badges.length === 0 && <p className="text-sm text-muted-foreground">No badges yet.</p>}
          {badges.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
              <span>
                <b>{nameOf(b.worker_id)}</b> · {b.skill_name}{" "}
                <Badge variant="secondary">{b.badge_level}</Badge>
              </span>
              <Button size="icon" variant="ghost" onClick={() => revoke(b.id)} aria-label="Revoke badge">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Youtube className="h-4 w-4" /> Training videos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-4">
            <Input placeholder="Video title" value={vform.title} onChange={(e) => setVform({ ...vform, title: e.target.value })} />
            <Input placeholder="YouTube URL" value={vform.youtube_url} onChange={(e) => setVform({ ...vform, youtube_url: e.target.value })} className="md:col-span-2" />
            <div className="flex gap-2">
              <Select value={vform.skill_category} onValueChange={(v) => setVform({ ...vform, skill_category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SKILLS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Button onClick={addVideo}>Add</Button>
            </div>
          </div>
          {videos.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
              <span className="truncate">{v.title} · <span className="text-muted-foreground">{v.skill_category}</span></span>
              <Button size="icon" variant="ghost" onClick={() => removeVideo(v.id)} aria-label="Delete video">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSkillBadges;

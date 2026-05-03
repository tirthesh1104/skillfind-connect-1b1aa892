import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SKILL_OPTIONS } from "@/lib/labour";
import { toast } from "sonner";
import { Save } from "lucide-react";

const LabourProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    full_name: "", phone: "", location: "", skill: "Plumber",
    price_per_day: 0, experience_years: 0, bio: "", is_available: true,
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: profile }, { data: lp }] = await Promise.all([
        supabase.rpc("get_my_profile").then((r) => ({ data: r.data as any })),
        supabase.from("labour_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      setForm({
        full_name: profile?.full_name ?? "",
        phone: profile?.phone ?? "",
        location: profile?.location ?? "",
        skill: lp?.skill ?? "Plumber",
        price_per_day: lp?.price_per_day ?? 0,
        experience_years: lp?.experience_years ?? 0,
        bio: lp?.bio ?? "",
        is_available: lp?.is_available ?? true,
      });
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("profiles").update({ full_name: form.full_name, phone: form.phone, location: form.location }).eq("id", user.id),
      supabase.from("labour_profiles").update({
        skill: form.skill, price_per_day: Number(form.price_per_day) || 0,
        experience_years: Number(form.experience_years) || 0, bio: form.bio, is_available: form.is_available,
      }).eq("user_id", user.id),
    ]);
    setSaving(false);
    if (e1 || e2) return toast.error(e1?.message ?? e2?.message ?? "Save failed");
    toast.success("Profile updated");
  };

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Profile</h1>
        <p className="text-sm text-muted-foreground">Keep your details up to date so contractors can find you.</p>
      </div>

      <div className="glass-card grid gap-4 p-6 md:grid-cols-2">
        <div><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="md:col-span-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div>
          <Label>Skill</Label>
          <Select value={form.skill} onValueChange={(v) => setForm({ ...form, skill: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SKILL_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Price per day (Rs.)</Label><Input type="number" value={form.price_per_day} onChange={(e) => setForm({ ...form, price_per_day: e.target.value })} /></div>
        <div><Label>Experience (years)</Label><Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} /></div>
        <div className="flex items-end gap-3 pt-1">
          <Switch checked={form.is_available} onCheckedChange={(v) => setForm({ ...form, is_available: v })} />
          <Label className="cursor-pointer">Available for hire</Label>
        </div>
        <div className="md:col-span-2"><Label>Bio</Label><Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
        <div className="md:col-span-2">
          <Button className="bg-gradient-primary" onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Changes"}</Button>
        </div>
      </div>
    </div>
  );
};

export default LabourProfile;

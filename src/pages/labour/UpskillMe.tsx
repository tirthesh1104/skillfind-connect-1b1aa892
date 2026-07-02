import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Sparkles, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/role-chatbot`;

export default function UpskillMe() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [recs, setRecs] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("labour_profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const generate = async () => {
    if (!profile) return toast.error("Complete your labour profile first");
    setLoading(true);
    setRecs("");
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          role: "worker",
          language: "en",
          context: { skill_profile: profile },
          messages: [{
            role: "user",
            content: `My current skill: ${profile.skill}, experience: ${profile.experience_years} years, wage: ₹${profile.price_per_day}/day.
Suggest 3 upskilling paths to increase my daily wage. For each: skill name, expected new wage, free/low-cost training source in India (PMKVY, NSDC, Skill India, ITI, YouTube). Keep it short and practical.`,
          }],
        }),
      });
      if (!res.ok || !res.body) throw new Error("AI error");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "", acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const d = line.slice(5).trim();
          if (!d || d === "[DONE]") continue;
          try {
            const j = JSON.parse(d);
            const delta = j.choices?.[0]?.delta?.content;
            if (delta) { acc += delta; setRecs(acc); }
          } catch {}
        }
      }
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><GraduationCap className="h-7 w-7 text-primary" /> Upskill Me</h1>
        <p className="text-muted-foreground text-sm mt-1">AI-powered training recommendations to earn more.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Your Current Profile</CardTitle></CardHeader>
        <CardContent>
          {profile ? (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><p className="text-xs text-muted-foreground">Skill</p><p className="font-semibold">{profile.skill}</p></div>
              <div><p className="text-xs text-muted-foreground">Experience</p><p className="font-semibold">{profile.experience_years} yr</p></div>
              <div><p className="text-xs text-muted-foreground">Wage</p><p className="font-semibold">₹{profile.price_per_day}/day</p></div>
            </div>
          ) : <p className="text-sm text-muted-foreground">Complete your profile first.</p>}
        </CardContent>
      </Card>

      <Button onClick={generate} disabled={loading || !profile} className="w-full" size="lg">
        <Sparkles className="mr-2 h-4 w-4" />
        {loading ? "Generating..." : "Get AI Recommendations"}
      </Button>

      {recs && (
        <Card>
          <CardHeader><CardTitle>Recommended Learning Paths</CardTitle></CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm">{recs}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild><a href="https://www.pmkvyofficial.org/" target="_blank" rel="noreferrer">PMKVY <ExternalLink className="ml-1 h-3 w-3" /></a></Button>
              <Button size="sm" variant="outline" asChild><a href="https://www.skillindiadigital.gov.in/" target="_blank" rel="noreferrer">Skill India <ExternalLink className="ml-1 h-3 w-3" /></a></Button>
              <Button size="sm" variant="outline" asChild><a href="https://nsdcindia.org/" target="_blank" rel="noreferrer">NSDC <ExternalLink className="ml-1 h-3 w-3" /></a></Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { GraduationCap } from "lucide-react";

const embedUrl = (url: string) => {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
};

const Learn = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [cat, setCat] = useState("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("training_videos").select("*").order("created_at", { ascending: false });
      setVideos(data ?? []);
    })();
  }, []);

  const cats = useMemo(() => ["all", ...Array.from(new Set(videos.map((v) => v.skill_category)))], [videos]);
  const shown = videos.filter((v) => cat === "all" || v.skill_category === cat);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <GraduationCap className="h-6 w-6 text-primary" /> Learn
        </h1>
        <p className="text-sm text-muted-foreground">Short 2–3 minute skill videos. शिका आणि कमवा.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <Button key={c} size="sm" variant={cat === c ? "default" : "outline"} onClick={() => setCat(c)}>{c}</Button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No videos yet" description="Training videos added by the admin will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((v) => {
            const src = embedUrl(v.youtube_url);
            return (
              <Card key={v.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{v.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{v.skill_category}</p>
                </CardHeader>
                <CardContent>
                  {src ? (
                    <div className="aspect-video w-full overflow-hidden rounded-md">
                      <iframe src={src} title={v.title} className="h-full w-full" loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                        allowFullScreen />
                    </div>
                  ) : (
                    <a href={v.youtube_url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Open video</a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Learn;

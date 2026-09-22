import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to Supabase realtime changes on one or more tables and run a
 * callback (usually a silent re-fetch) whenever anything changes.
 * Additive helper — does not alter any existing behaviour.
 */
export const useRealtime = (tables: string[], onChange: () => void, enabled = true) => {
  const cb = useRef(onChange);
  cb.current = onChange;
  const key = tables.join(",");

  useEffect(() => {
    if (!enabled || !tables.length) return;
    const channel = supabase.channel(`rt-${key}-${Math.random().toString(36).slice(2)}`);
    tables.forEach((table) => {
      channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table },
        () => cb.current(),
      );
    });
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);
};

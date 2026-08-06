import { useEffect, useState } from "react";

const KEY = "sfc_data_saver";
const EVT = "sfc_data_saver_change";

export const isDataSaver = () => {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
};

export const setDataSaver = (on: boolean) => {
  try { localStorage.setItem(KEY, on ? "1" : "0"); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVT));
};

/** Data Saver Mode preference (persisted in localStorage, shared across components). */
export const useDataSaver = () => {
  const [on, setOn] = useState(isDataSaver);
  useEffect(() => {
    const sync = () => setOn(isDataSaver());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, []);
  return { dataSaver: on, setDataSaver };
};

/** Polling interval in ms — slower when data saver is on. */
export const usePollInterval = (fast = 15000) => {
  const { dataSaver } = useDataSaver();
  return dataSaver ? 60000 : fast;
};

/** navigator.onLine with live updates. */
export const useOnline = () => {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);
  return online;
};

export const cacheSet = (key: string, value: unknown) => {
  try { localStorage.setItem(`sfc_cache_${key}`, JSON.stringify({ at: Date.now(), value })); } catch { /* ignore */ }
};

export const cacheGet = <T,>(key: string): { at: number; value: T } | null => {
  try {
    const raw = localStorage.getItem(`sfc_cache_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

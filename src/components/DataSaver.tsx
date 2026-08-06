import { useDataSaver, useOnline } from "@/hooks/useDataSaver";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { WifiOff, Gauge } from "lucide-react";

/** Data Saver toggle card for the worker app. */
export const DataSaverCard = () => {
  const { dataSaver, setDataSaver } = useDataSaver();
  return (
    <div className="glass-card flex items-center gap-3 p-4">
      <Gauge className="h-6 w-6 text-primary" />
      <div className="flex-1">
        <Label htmlFor="data-saver" className="text-sm font-semibold">Data Saver Mode</Label>
        <p className="text-xs text-muted-foreground">
          Images off, slower refresh, and last job list saved offline.
        </p>
      </div>
      <Switch id="data-saver" checked={dataSaver} onCheckedChange={setDataSaver} />
    </div>
  );
};

/** Thin banner shown when the device is offline. */
export const OfflineBanner = () => {
  const online = useOnline();
  if (online) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-destructive/15 px-3 py-1.5 text-xs font-medium text-destructive">
      <WifiOff className="h-3.5 w-3.5" /> You're offline — showing last saved data
    </div>
  );
};

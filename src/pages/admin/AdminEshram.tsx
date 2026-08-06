import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck } from "lucide-react";

const AdminEshram = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "unverified">("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("admin_list_profiles");
      setRows((data as any[]) ?? []);
    })();
  }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    if (filter === "verified" && !r.eshram_verified) return false;
    if (filter === "unverified" && r.eshram_verified) return false;
    if (q && !(`${r.full_name} ${r.phone ?? ""} ${r.eshram_number ?? ""}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }), [rows, q, filter]);

  const verifiedCount = rows.filter((r) => r.eshram_verified).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <ShieldCheck className="h-6 w-6 text-primary" /> e-Shram Verification
        </h1>
        <p className="text-sm text-muted-foreground">
          {verifiedCount} verified · {rows.length - verifiedCount} unverified
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search name / phone / e-Shram no." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        {(["all", "verified", "unverified"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>e-Shram No.</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.full_name}</TableCell>
                  <TableCell>{r.phone ?? "—"}</TableCell>
                  <TableCell>{r.eshram_number ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={r.eshram_verified ? "default" : "secondary"}>
                      {r.eshram_verified ? "Verified" : "Unverified"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">No users found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEshram;

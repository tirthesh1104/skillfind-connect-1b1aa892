import { supabase } from "@/integrations/supabase/client";

export type WageRow = { state: string; skill_category: string; wage_per_day: number };

let cache: WageRow[] | null = null;

export async function getMinimumWages(): Promise<WageRow[]> {
  if (cache) return cache;
  const { data } = await supabase.from("minimum_wages" as any).select("state,skill_category,wage_per_day");
  cache = (data as any) ?? [];
  return cache!;
}

export async function checkWage(state: string, category: string, offered: number) {
  const rows = await getMinimumWages();
  const row = rows.find(r => r.state === state && r.skill_category === category);
  if (!row) return { compliant: true, minimum: 0, message: "" };
  const compliant = offered >= row.wage_per_day;
  return {
    compliant,
    minimum: row.wage_per_day,
    message: compliant
      ? `✓ Wage compliant with Labour Code 2025 (min ₹${row.wage_per_day}/day)`
      : `⚠️ हे ${state} minimum wage (₹${row.wage_per_day}/day) पेक्षा कमी आहे. Labour Code 2025 violation. किमान ₹${row.wage_per_day} द्या.`,
  };
}

export const SKILL_CATEGORIES = ["Unskilled", "Semi-skilled", "Skilled", "Highly Skilled"];

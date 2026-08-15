import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

type Item = { label: string; to: string };
type Section = { id: string; title: string; items: Item[] };

const SECTIONS: Record<"labour" | "contractor" | "admin" | "client", Section[]> = {
  labour: [
    { id: "jobs", title: "Jobs & Work", items: [
      { label: "Find Jobs", to: "/labour/find-jobs" },
      { label: "My Applications", to: "/labour/applications" },
      { label: "Daily Tasks", to: "/daily-tasks" },
      { label: "Work Orders", to: "/work-orders" },
      { label: "Before/After Work Proof", to: "/work-proof" },
      { label: "Proof Feed", to: "/proof-feed" },
      { label: "My Schedule", to: "/schedule" },
      { label: "Labour Chowk", to: "/labour-chowk" },
      { label: "Rate Jobs", to: "/rate-jobs" },
    ]},
    { id: "pay", title: "Payments & Documents", items: [
      { label: "Payment Details", to: "/my-payment-details" },
      { label: "Receipts", to: "/my-receipts" },
      { label: "Payslips", to: "/my-payslips" },
      { label: "Wage Advance Requests", to: "/advance-requests" },
      { label: "My Advances", to: "/my-advances" },
      { label: "Escrow Protection", to: "/escrow" },
      { label: "Insurance", to: "/insurance" },
      { label: "Wage Agreements", to: "/wage-agreements" },
      { label: "My Documents", to: "/my-documents" },
    ]},
    { id: "safety", title: "Safety & Support", items: [
      { label: "Site Attendance (GPS)", to: "/site-attendance" },
      { label: "Live Map", to: "/live-map" },
      { label: "Messages", to: "/messages" },
      { label: "Compliance Board", to: "/compliance" },
    ]},
    { id: "profile", title: "Profile & Verification", items: [
      { label: "My Profile", to: "/labour/profile" },
      { label: "Government ID / e-Shram", to: "/government-id" },
      { label: "My ID Card", to: "/my-id-card" },
      { label: "My QR Profile", to: "/my-qr" },
      { label: "Certificates", to: "/my-certificates" },
      { label: "Learn & Upskill", to: "/learn" },
      { label: "Upskill Me (AI)", to: "/upskill" },
    ]},
  ],
  contractor: [
    { id: "jobs", title: "Jobs & Work", items: [
      { label: "Find Labour", to: "/contractor/find-labour" },
      { label: "My Jobs", to: "/contractor/jobs" },
      { label: "Requests", to: "/contractor/requests" },
      { label: "Daily Tasks", to: "/daily-tasks" },
      { label: "Work Orders", to: "/work-orders" },
      { label: "Milestones", to: "/milestones" },
      { label: "Sites", to: "/sites" },
      { label: "Materials", to: "/materials" },
      { label: "Sub-Contractors", to: "/sub-contractors" },
      { label: "Work Proof", to: "/work-proof" },
      { label: "DPR", to: "/dpr" },
    ]},
    { id: "pay", title: "Payments & Documents", items: [
      { label: "Pay Labour", to: "/pay-labour" },
      { label: "Gang Pay", to: "/gang-pay" },
      { label: "Escrow", to: "/escrow" },
      { label: "Wage Ledger", to: "/wage-ledger" },
      { label: "Advance Requests", to: "/advance-requests" },
      { label: "Receipts", to: "/my-receipts" },
      { label: "Muster Roll", to: "/muster-roll" },
      { label: "Documents", to: "/my-documents" },
      { label: "Plans & Billing", to: "/pricing" },
    ]},
    { id: "safety", title: "Safety & Support", items: [
      { label: "Live Map", to: "/live-map" },
      { label: "Site Attendance", to: "/site-attendance" },
      { label: "Messages", to: "/messages" },
      { label: "Compliance Board", to: "/compliance" },
    ]},
    { id: "profile", title: "Profile & Verification", items: [
      { label: "Business Verification (KYC)", to: "/business-verification" },
      { label: "Certificates", to: "/my-certificates" },
      { label: "Learn", to: "/learn" },
    ]},
  ],
  admin: [
    { id: "jobs", title: "Jobs & Work", items: [
      { label: "Jobs", to: "/admin/jobs" },
      { label: "Requests", to: "/admin/requests" },
      { label: "Sites", to: "/sites" },
      { label: "Milestones", to: "/milestones" },
      { label: "Proof Feed", to: "/proof-feed" },
      { label: "DPR", to: "/dpr" },
    ]},
    { id: "pay", title: "Payments & Documents", items: [
      { label: "All Payments", to: "/admin/payments" },
      { label: "Wage Ledger", to: "/wage-ledger" },
      { label: "Escrow", to: "/escrow" },
      { label: "Insurance Claims", to: "/admin/insurance-claims" },
      { label: "Muster Roll", to: "/muster-roll" },
    ]},
    { id: "safety", title: "Safety & Support", items: [
      { label: "SOS Alerts", to: "/admin/sos" },
      { label: "Live Map", to: "/live-map" },
      { label: "Disputes", to: "/admin/disputes" },
      { label: "Fraud Scan", to: "/admin/fraud" },
      { label: "Audit Center", to: "/admin/audit" },
    ]},
    { id: "profile", title: "Profile & Verification", items: [
      { label: "Users", to: "/admin/users" },
      { label: "Contractor KYC", to: "/admin/contractor-kyc" },
      { label: "e-Shram Verification", to: "/admin/eshram" },
      { label: "Skill Badges", to: "/admin/skill-badges" },
      { label: "Compliance Board", to: "/compliance" },
      { label: "Analytics", to: "/admin/analytics" },
    ]},
  ],
  client: [
    { id: "jobs", title: "Jobs & Work", items: [
      { label: "Milestones", to: "/milestones" },
      { label: "Proof Feed", to: "/proof-feed" },
      { label: "Live Map", to: "/live-map" },
    ]},
    { id: "safety", title: "Safety & Support", items: [
      { label: "Messages", to: "/messages" },
    ]},
  ],
};

export const DashboardSections = ({
  role,
  className,
}: { role: "labour" | "contractor" | "admin" | "client"; className?: string }) => {
  const sections = SECTIONS[role] ?? [];
  if (!sections.length) return null;

  return (
    <div className={cn("glass-card p-4 sm:p-6", className)}>
      <h2 className="mb-2 text-lg font-semibold">All Features</h2>
      <p className="mb-2 text-xs text-muted-foreground">Everything is still here — just grouped. Tap a section to expand.</p>
      <Accordion type="multiple" className="w-full">
        {sections.map((s) => (
          <AccordionItem key={s.id} value={s.id}>
            <AccordionTrigger className="text-sm font-medium">{s.title}</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {s.items.map((i) => (
                  <Link
                    key={i.to + i.label}
                    to={i.to}
                    className="rounded-lg border border-border bg-background/50 px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {i.label}
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

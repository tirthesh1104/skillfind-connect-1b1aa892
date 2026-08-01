import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminVerify from "./pages/AdminVerify";
import Messages from "./pages/Messages";

import ContractorHome from "./pages/contractor/ContractorHome";
import FindLabour from "./pages/contractor/FindLabour";
import ContractorJobs from "./pages/contractor/ContractorJobs";
import ContractorRequests from "./pages/contractor/ContractorRequests";
import ClientHome from "./pages/client/ClientHome";
import PayLabour from "./pages/PayLabour";
import MyReceipts from "./pages/MyReceipts";
import MyPaymentDetails from "./pages/labour/MyPaymentDetails";
import MyIdCard from "./pages/labour/MyIdCard";
import MyPayslips from "./pages/labour/MyPayslips";
import PublicWorker from "./pages/PublicWorker";
import MyDocuments from "./pages/MyDocuments";
import MyAdvances from "./pages/MyAdvances";
import Insurance from "./pages/Insurance";
import WageAgreements from "./pages/WageAgreements";
import UpskillMe from "./pages/labour/UpskillMe";

import LabourHome from "./pages/labour/LabourHome";
import LabourProfile from "./pages/labour/LabourProfile";
import LabourFindJobs from "./pages/labour/LabourFindJobs";
import LabourApplications from "./pages/labour/LabourApplications";

import AdminHome from "./pages/admin/AdminHome";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminJobs from "./pages/admin/AdminJobs";
import AdminRequests from "./pages/admin/AdminRequests";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminDisputes from "./pages/admin/AdminDisputes";
import AdminFraud from "./pages/admin/AdminFraud";
import AdminInsuranceClaims from "./pages/admin/AdminInsuranceClaims";
import AdminSOS from "./pages/admin/AdminSOS";
import MySchedule from "./pages/MySchedule";
import MyCertificates from "./pages/MyCertificates";
import MyQR from "./pages/MyQR";
import GangPay from "./pages/GangPay";
import RateJobs from "./pages/RateJobs";
import DailyTasks from "./pages/DailyTasks";
import WorkOrders from "./pages/WorkOrders";
import MusterRoll from "./pages/MusterRoll";
import DPR from "./pages/DPR";
import MultiSiteDashboard from "./pages/MultiSiteDashboard";
import Materials from "./pages/Materials";
import SubContractors from "./pages/SubContractors";
import Milestones from "./pages/Milestones";
import LabourChowk from "./pages/LabourChowk";
import Pricing from "./pages/Pricing";

const queryClient = new QueryClient();

const RoleLayout = ({ children, roles }: { children: React.ReactNode; roles: ("admin" | "contractor" | "labour" | "client")[] }) => (
  <ProtectedRoute allowedRoles={roles}>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin/verify" element={<AdminVerify />} />

            {/* Contractor */}
            <Route path="/contractor" element={<RoleLayout roles={["contractor"]}><ContractorHome /></RoleLayout>} />
            <Route path="/contractor/find-labour" element={<RoleLayout roles={["contractor"]}><FindLabour /></RoleLayout>} />
            <Route path="/contractor/jobs" element={<RoleLayout roles={["contractor"]}><ContractorJobs /></RoleLayout>} />
            <Route path="/contractor/requests" element={<RoleLayout roles={["contractor"]}><ContractorRequests /></RoleLayout>} />

            {/* Labour */}
            <Route path="/labour" element={<RoleLayout roles={["labour"]}><LabourHome /></RoleLayout>} />
            <Route path="/labour/profile" element={<RoleLayout roles={["labour"]}><LabourProfile /></RoleLayout>} />
            <Route path="/labour/find-jobs" element={<RoleLayout roles={["labour"]}><LabourFindJobs /></RoleLayout>} />
            <Route path="/labour/applications" element={<RoleLayout roles={["labour"]}><LabourApplications /></RoleLayout>} />

            {/* Client */}
            <Route path="/client" element={<RoleLayout roles={["client"]}><ClientHome /></RoleLayout>} />

            {/* Admin */}
            <Route path="/admin" element={<RoleLayout roles={["admin"]}><AdminHome /></RoleLayout>} />
            <Route path="/admin/users" element={<RoleLayout roles={["admin"]}><AdminUsers /></RoleLayout>} />
            <Route path="/admin/jobs" element={<RoleLayout roles={["admin"]}><AdminJobs /></RoleLayout>} />
            <Route path="/admin/requests" element={<RoleLayout roles={["admin"]}><AdminRequests /></RoleLayout>} />
            <Route path="/admin/analytics" element={<RoleLayout roles={["admin"]}><AdminAnalytics /></RoleLayout>} />
            <Route path="/admin/disputes" element={<RoleLayout roles={["admin"]}><AdminDisputes /></RoleLayout>} />
            <Route path="/admin/fraud" element={<RoleLayout roles={["admin"]}><AdminFraud /></RoleLayout>} />
            <Route path="/admin/insurance-claims" element={<RoleLayout roles={["admin"]}><AdminInsuranceClaims /></RoleLayout>} />

            {/* Messages (all roles) */}
            <Route path="/messages" element={<RoleLayout roles={["admin","contractor","labour","client"]}><Messages /></RoleLayout>} />

            {/* Payment flow */}
            <Route path="/my-payment-details" element={<RoleLayout roles={["labour"]}><MyPaymentDetails /></RoleLayout>} />
            <Route path="/my-receipts" element={<RoleLayout roles={["labour","contractor"]}><MyReceipts /></RoleLayout>} />
            <Route path="/pay-labour" element={<RoleLayout roles={["contractor","admin"]}><PayLabour /></RoleLayout>} />
            <Route path="/admin/payments" element={<RoleLayout roles={["admin"]}><MyReceipts /></RoleLayout>} />
            <Route path="/my-id-card" element={<RoleLayout roles={["labour"]}><MyIdCard /></RoleLayout>} />
            <Route path="/my-payslips" element={<RoleLayout roles={["labour"]}><MyPayslips /></RoleLayout>} />
            <Route path="/my-documents" element={<RoleLayout roles={["labour","contractor"]}><MyDocuments /></RoleLayout>} />
            <Route path="/my-advances" element={<RoleLayout roles={["labour","contractor"]}><MyAdvances /></RoleLayout>} />
            <Route path="/insurance" element={<RoleLayout roles={["labour","contractor","admin"]}><Insurance /></RoleLayout>} />
            <Route path="/wage-agreements" element={<RoleLayout roles={["labour","contractor"]}><WageAgreements /></RoleLayout>} />
            <Route path="/upskill" element={<RoleLayout roles={["labour"]}><UpskillMe /></RoleLayout>} />

            {/* New feature routes */}
            <Route path="/schedule" element={<RoleLayout roles={["labour","contractor"]}><MySchedule /></RoleLayout>} />
            <Route path="/my-certificates" element={<RoleLayout roles={["labour","contractor"]}><MyCertificates /></RoleLayout>} />
            <Route path="/my-qr" element={<RoleLayout roles={["labour"]}><MyQR /></RoleLayout>} />
            <Route path="/gang-pay" element={<RoleLayout roles={["contractor"]}><GangPay /></RoleLayout>} />
            <Route path="/rate-jobs" element={<RoleLayout roles={["labour","contractor"]}><RateJobs /></RoleLayout>} />
            <Route path="/admin/sos" element={<RoleLayout roles={["admin"]}><AdminSOS /></RoleLayout>} />

            {/* Phase 1 additions */}
            <Route path="/daily-tasks" element={<RoleLayout roles={["contractor","labour"]}><DailyTasks /></RoleLayout>} />
            <Route path="/work-orders" element={<RoleLayout roles={["contractor","labour"]}><WorkOrders /></RoleLayout>} />
            <Route path="/muster-roll" element={<RoleLayout roles={["contractor","admin"]}><MusterRoll /></RoleLayout>} />
            <Route path="/dpr" element={<RoleLayout roles={["contractor","admin"]}><DPR /></RoleLayout>} />

            {/* Phase 2 additions */}
            <Route path="/sites" element={<RoleLayout roles={["contractor","admin"]}><MultiSiteDashboard /></RoleLayout>} />
            <Route path="/materials" element={<RoleLayout roles={["contractor","labour","admin"]}><Materials /></RoleLayout>} />
            <Route path="/sub-contractors" element={<RoleLayout roles={["contractor","admin"]}><SubContractors /></RoleLayout>} />
            <Route path="/milestones" element={<RoleLayout roles={["contractor","client","labour","admin"]}><Milestones /></RoleLayout>} />

            {/* Live availability + plans */}
            <Route path="/labour-chowk" element={<RoleLayout roles={["contractor","labour","admin"]}><LabourChowk /></RoleLayout>} />
            <Route path="/pricing" element={<RoleLayout roles={["contractor"]}><Pricing /></RoleLayout>} />






            {/* Public worker profile (QR scan target) */}
            <Route path="/worker/:id" element={<PublicWorker />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

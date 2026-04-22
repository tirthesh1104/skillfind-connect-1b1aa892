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

import ContractorHome from "./pages/contractor/ContractorHome";
import FindLabour from "./pages/contractor/FindLabour";
import ContractorJobs from "./pages/contractor/ContractorJobs";
import ContractorRequests from "./pages/contractor/ContractorRequests";

import LabourHome from "./pages/labour/LabourHome";
import LabourProfile from "./pages/labour/LabourProfile";
import LabourFindJobs from "./pages/labour/LabourFindJobs";
import LabourApplications from "./pages/labour/LabourApplications";

import AdminHome from "./pages/admin/AdminHome";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminJobs from "./pages/admin/AdminJobs";
import AdminRequests from "./pages/admin/AdminRequests";

const queryClient = new QueryClient();

const RoleLayout = ({ children, roles }: { children: React.ReactNode; roles: ("admin" | "contractor" | "labour")[] }) => (
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

            {/* Admin */}
            <Route path="/admin" element={<RoleLayout roles={["admin"]}><AdminHome /></RoleLayout>} />
            <Route path="/admin/users" element={<RoleLayout roles={["admin"]}><AdminUsers /></RoleLayout>} />
            <Route path="/admin/jobs" element={<RoleLayout roles={["admin"]}><AdminJobs /></RoleLayout>} />
            <Route path="/admin/requests" element={<RoleLayout roles={["admin"]}><AdminRequests /></RoleLayout>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

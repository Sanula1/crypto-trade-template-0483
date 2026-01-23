import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/UsersPage";
import InstitutePage from "./pages/InstitutePage";
import SubjectsPage from "./pages/SubjectsPage";
import StructuredLecturesPage from "./pages/StructuredLecturesPage";
import TransportPage from "./pages/TransportPage";
import SystemPaymentPage from "./pages/SystemPaymentPage";
import SMSPage from "./pages/SMSPage";
import SMSPaymentPage from "./pages/SMSPaymentPage";
import AdvertisementPage from "./pages/AdvertisementPage";
import OrganizationPage from "./pages/OrganizationPage";
import CardManagementPage from "./pages/CardManagementPage";
import CardOrdersPage from "./pages/CardOrdersPage";
import CardPaymentsPage from "./pages/CardPaymentsPage";
import NotificationsPage from "./pages/NotificationsPage";
import FamilyManagementPage from "./pages/FamilyManagementPage";
import ProfileImagePage from "./pages/ProfileImagePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/users" element={<UsersPage />} />
            <Route path="/dashboard/institute" element={<InstitutePage />} />
            <Route path="/dashboard/subjects" element={<SubjectsPage />} />
            <Route path="/dashboard/structured-lectures" element={<StructuredLecturesPage />} />
            <Route path="/dashboard/transport" element={<TransportPage />} />
            <Route path="/dashboard/system-payment" element={<SystemPaymentPage />} />
            <Route path="/dashboard/sms" element={<SMSPage />} />
            <Route path="/dashboard/sms-payment" element={<SMSPaymentPage />} />
            <Route path="/dashboard/advertisement" element={<AdvertisementPage />} />
            <Route path="/dashboard/organizations" element={<OrganizationPage />} />
            <Route path="/dashboard/card-management" element={<CardManagementPage />} />
            <Route path="/dashboard/card-orders" element={<CardOrdersPage />} />
            <Route path="/dashboard/card-payments" element={<CardPaymentsPage />} />
            <Route path="/dashboard/notifications" element={<NotificationsPage />} />
            <Route path="/dashboard/family-management" element={<FamilyManagementPage />} />
            <Route path="/dashboard/profile-images" element={<ProfileImagePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

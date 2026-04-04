import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Building2 } from "lucide-react";
import AppLayout from "./components/layout/AppLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import VerifyOtpPage from "./pages/auth/VerifyOtpPage";
import AuthCallbackPage from "./pages/auth/AuthCallbackPage";
import DashboardPage from "./pages/DashboardPage";
import PartnersPage from "./pages/master/PartnersPage";
import OpeningBalancePage from "./pages/master/OpeningBalancePage";
import AccountsPage from "./pages/master/AccountsPage";
import ARContractsPage from "./pages/ar/ARContractsPage";
import ARInvoicesPage from "./pages/ar/ARInvoicesPage";
import ARReceiptsPage from "./pages/ar/ARReceiptsPage";
import AROverduePage from "./pages/ar/AROverduePage";
import APContractsPage from "./pages/ap/APContractsPage";
import APInvoicesPage from "./pages/ap/APInvoicesPage";
import APPaymentRequestsPage from "./pages/ap/APPaymentRequestsPage";
import APPaymentsPage from "./pages/ap/APPaymentsPage";
import ReconciliationPage from "./pages/reports/ReconciliationPage";
import LedgerPage from "./pages/reports/LedgerPage";
import ManagementReportPage from "./pages/reports/ManagementReportPage";
import AgingReportPage from "./pages/reports/AgingReportPage";
import UsersPage from "./pages/admin/UsersPage";
import AuditLogPage from "./pages/admin/AuditLogPage";
import ChangePasswordPage from "./pages/settings/ChangePasswordPage";
import NotFound from "./pages/NotFound";
import type { ReactNode } from "react";

function RequireAuth({ children }: Readonly<{ children: ReactNode }>) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Building2 size={24} className="text-primary-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/auth/reset-password"
              element={<ResetPasswordPage />}
            />
            <Route path="/auth/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            {/* Public dashboard — accessible without auth */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
            </Route>
            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route path="/partners" element={<PartnersPage />} />
              <Route path="/partners/new" element={<PartnersPage />} />
              <Route path="/opening-balance" element={<OpeningBalancePage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/ar/contracts" element={<ARContractsPage />} />
              <Route path="/ar/invoices" element={<ARInvoicesPage />} />
              <Route path="/ar/receipts" element={<ARReceiptsPage />} />
              <Route path="/ar/overdue" element={<AROverduePage />} />
              <Route path="/ap/contracts" element={<APContractsPage />} />
              <Route path="/ap/invoices" element={<APInvoicesPage />} />
              <Route
                path="/ap/payment-requests"
                element={<APPaymentRequestsPage />}
              />
              <Route path="/ap/payments" element={<APPaymentsPage />} />
              <Route
                path="/reports/reconciliation"
                element={<ReconciliationPage />}
              />
              <Route path="/reports/ledger" element={<LedgerPage />} />
              <Route
                path="/reports/management"
                element={<ManagementReportPage />}
              />
              <Route path="/reports/aging" element={<AgingReportPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/audit-log" element={<AuditLogPage />} />
              <Route
                path="/settings/change-password"
                element={<ChangePasswordPage />}
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

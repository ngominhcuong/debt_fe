import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/layout/AppLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AppLoadingScreen from "./components/shared/AppLoadingScreen";

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
import ItemsPage from "./pages/master/ItemsPage";
import PartnerDetailPage from "./pages/master/PartnerDetailPage";
import PartnerUpsertPage from "./pages/master/PartnerUpsertPage";
import ItemDetailPage from "./pages/master/ItemDetailPage";
import ItemUpsertPage from "./pages/master/ItemUpsertPage";
import AccountDetailPage from "./pages/master/AccountDetailPage";
import AccountUpsertPage from "./pages/master/AccountUpsertPage";
import ARContractsPage from "./pages/ar/ARContractsPage";
import ARInvoicesPage from "./pages/ar/ARInvoicesPage";
import ARReceiptsPage from "./pages/ar/ARReceiptsPage";
import AROverduePage from "./pages/ar/AROverduePage";
import ARDebtsPage from "./pages/ar/ARDebtsPage";
import APContractsPage from "./pages/ap/APContractsPage";
import APInvoicesPage from "./pages/ap/APInvoicesPage";
import APInvoiceUpsertPage from "./pages/ap/APInvoiceUpsertPage";
import APPaymentRequestsPage from "./pages/ap/APPaymentRequestsPage";
import APPaymentsPage from "./pages/ap/APPaymentsPage";
import APDebtsPage from "./pages/ap/APDebtsPage";
import SalesInvoiceUpsertPage from "./pages/sales/SalesInvoiceUpsertPage";
import SalesInvoicesPage from "./pages/sales/SalesInvoicesPage";
import SalesInvoiceDetailPage from "./pages/sales/SalesInvoiceDetailPage";
import ReconciliationPage from "./pages/reports/ReconciliationPage";
import LedgerPage from "./pages/reports/LedgerPage";
import ManagementReportPage from "./pages/reports/ManagementReportPage";
import AgingReportPage from "./pages/reports/AgingReportPage";
import UsersPage from "./pages/admin/UsersPage";
import AuditLogPage from "./pages/admin/AuditLogPage";
import ChangePasswordPage from "./pages/settings/ChangePasswordPage";
import InvoiceSettingsPage from "./pages/settings/InvoiceSettingsPage";
import ReminderSettingsPage from "./pages/settings/ReminderSettingsPage";
import InvoicePrintPage from "./pages/ar/InvoicePrintPage";
import NotFound from "./pages/NotFound";
import type { ReactNode } from "react";

function AppBootstrapGate({ children }: Readonly<{ children: ReactNode }>) {
  const { loading } = useAuth();
  const location = useLocation();

  const bypassBootstrapLoading = location.pathname === "/auth/callback";

  if (loading && !bypassBootstrapLoading) {
    return (
      <AppLoadingScreen
        message="Đang tải dữ liệu..."
        subMessage="Hệ thống đang đồng bộ phiên đăng nhập"
      />
    );
  }

  return <>{children}</>;
}

function RequireAuth({ children }: Readonly<{ children: ReactNode }>) {
  const { session, loading } = useAuth();

  if (loading) {
    return <AppLoadingScreen message="Đang tải dữ liệu..." />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RequireChief({ children }: Readonly<{ children: ReactNode }>) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <AppLoadingScreen message="Đang tải dữ liệu..." />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (profile && profile.role !== "CHIEF_ACCOUNTANT") {
    return <Navigate to="/" replace />;
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
          <AppBootstrapGate>
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
                <Route path="/partners/new" element={<PartnerUpsertPage />} />
                <Route path="/partners/:id" element={<PartnerDetailPage />} />
                <Route
                  path="/partners/:id/edit"
                  element={<PartnerUpsertPage />}
                />
                <Route path="/items" element={<ItemsPage />} />
                <Route path="/items/new" element={<ItemUpsertPage />} />
                <Route path="/items/:id" element={<ItemDetailPage />} />
                <Route path="/items/:id/edit" element={<ItemUpsertPage />} />
                <Route
                  path="/opening-balance"
                  element={<OpeningBalancePage />}
                />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/accounts/new" element={<AccountUpsertPage />} />
                <Route path="/accounts/:id" element={<AccountDetailPage />} />
                <Route
                  path="/accounts/:id/edit"
                  element={<AccountUpsertPage />}
                />
                <Route path="/ar/contracts" element={<ARContractsPage />} />
                <Route path="/ar/invoices" element={<ARInvoicesPage />} />
                <Route path="/ar/receipts" element={<ARReceiptsPage />} />
                <Route path="/ar/overdue" element={<AROverduePage />} />
                <Route path="/ar/debts" element={<ARDebtsPage />} />
                <Route path="/ap/contracts" element={<APContractsPage />} />
                <Route path="/ap/invoices" element={<APInvoicesPage />} />
                <Route
                  path="/ap/invoices/new"
                  element={<APInvoiceUpsertPage />}
                />
                <Route
                  path="/ap/invoices/:id/edit"
                  element={<APInvoiceUpsertPage />}
                />
                <Route
                  path="/ap/payment-requests"
                  element={<APPaymentRequestsPage />}
                />
                <Route path="/ap/payments" element={<APPaymentsPage />} />
                <Route path="/ap/debts" element={<APDebtsPage />} />
                <Route path="/sales/invoices" element={<SalesInvoicesPage />} />
                <Route
                  path="/sales/invoices/new"
                  element={<SalesInvoiceUpsertPage />}
                />
                <Route
                  path="/sales/invoices/:id"
                  element={<SalesInvoiceDetailPage />}
                />
                <Route
                  path="/sales/invoices/:id/edit"
                  element={<SalesInvoiceUpsertPage />}
                />
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
                <Route
                  path="/admin/users"
                  element={
                    <RequireChief>
                      <UsersPage />
                    </RequireChief>
                  }
                />
                <Route
                  path="/admin/audit-log"
                  element={
                    <RequireChief>
                      <AuditLogPage />
                    </RequireChief>
                  }
                />
                <Route
                  path="/settings/change-password"
                  element={<ChangePasswordPage />}
                />
                <Route
                  path="/settings/invoice-settings"
                  element={<InvoiceSettingsPage />}
                />
                <Route
                  path="/settings/reminders"
                  element={<ReminderSettingsPage />}
                />
              </Route>
              {/* Print pages — no sidebar layout */}
              <Route
                path="/ar/invoices/:id/print"
                element={
                  <RequireAuth>
                    <InvoicePrintPage />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppBootstrapGate>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

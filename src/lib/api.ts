const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:4000";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: "CHIEF_ACCOUNTANT" | "STAFF_ACCOUNTANT";
  provider: "EMAIL" | "GOOGLE";
  avatarUrl: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PartnerType = "CUSTOMER" | "SUPPLIER" | "BOTH";
export type ItemType = "GOODS" | "SERVICE" | "MATERIAL" | "OTHER";
export type AccountType =
  | "ASSET"
  | "LIABILITY"
  | "EQUITY"
  | "REVENUE"
  | "EXPENSE"
  | "OFF_BALANCE";
export type NormalBalance = "DEBIT" | "CREDIT";

export interface DebtReminderConfig {
  id: string;
  scope: "AR" | "AP" | "BOTH";
  enabled: boolean;
  daysBeforeDue: number;
  daysAfterDue: number;
  recipientEmail: string | null;
  ccEmails: string[] | null;
  lastSentAt: string | null;
  updatedAt: string;
}

export interface ReminderConfigPayload {
  scope?: "AR" | "AP" | "BOTH";
  enabled?: boolean;
  daysBeforeDue?: number;
  daysAfterDue?: number;
  recipientEmail?: string | null;
  ccEmails?: string[];
}

export interface GlobalReminderSettings {
  cronSchedule: string;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  defaultDaysBeforeDue: number;
  defaultDaysAfterDue: number;
  description: string;
}

export interface UpdateGlobalReminderPayload {
  reminderHour?: number;
  reminderMinute?: number;
  defaultDaysBeforeDue?: number;
  defaultDaysAfterDue?: number;
  reminderEnabled?: boolean;
}

export interface ReminderLog {
  id: string;
  scope: string;
  recipientEmail: string;
  subject: string;
  status: string;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  partner: { id: string; code: string; name: string };
}
export interface Partner {
  id: string;
  code: string;
  name: string;
  partnerType: PartnerType;
  taxCode: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  paymentTermDays: number | null;
  creditLimit: string | null;
  isActive: boolean;
  debtReminderOn: boolean;
  reminderEmail: string | null;
  reminderCcEmails: string[] | null;
  createdAt: string;
  updatedAt: string;
  debtReminders: DebtReminderConfig[];
}

export interface AccountSummary {
  id: string;
  code: string;
  name: string;
  accountType: AccountType;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  itemType: ItemType;
  unit: string;
  salePrice: string | null;
  purchasePrice: string | null;
  vatRate: string | null;
  revenueAccountId: string | null;
  cogsAccountId: string | null;
  inventoryAccountId: string | null;
  isTrackedInventory: boolean;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  revenueAccount: AccountSummary | null;
  cogsAccount: AccountSummary | null;
  inventoryAccount: AccountSummary | null;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  parentId: string | null;
  level: number;
  isPosting: boolean;
  allowManualEntry: boolean;
  isActive: boolean;
  sortOrder: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  parent: { id: string; code: string; name: string } | null;
}

export interface PartnerPayload {
  code?: string;
  name: string;
  partnerType: PartnerType;
  taxCode?: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentTermDays?: number;
  creditLimit?: number;
  isActive?: boolean;
  debtReminderOn?: boolean;
  reminderEmail?: string;
  reminderCcEmails?: string[];
}

export interface ItemPayload {
  sku?: string;
  name: string;
  itemType: ItemType;
  unit: string;
  salePrice?: number;
  purchasePrice?: number;
  vatRate?: number;
  revenueAccountId?: string | null;
  cogsAccountId?: string | null;
  inventoryAccountId?: string | null;
  isTrackedInventory?: boolean;
  isActive?: boolean;
  description?: string;
}

export interface AccountPayload {
  code: string;
  name: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  parentId?: string | null;
  isPosting?: boolean;
  allowManualEntry?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  description?: string;
}

export type InvoiceStatus = "DRAFT" | "ISSUED" | "CANCELLED";

// ─── Sales Invoice response shapes ───────────────────────────────────────────

export interface SalesInvoiceCustomer {
  id: string;
  code: string;
  name: string;
  address: string | null;
  taxCode: string | null;
}

export interface SalesInvoicePostedBy {
  id: string;
  fullName: string | null;
  email: string;
}

export interface SalesInvoiceListItem {
  id: string;
  voucherNumber: string;
  voucherDate: string;
  accountingDate: string;
  description: string | null;
  totalAmount: string;
  vatAmount: string;
  grandTotal: string;
  invoiceNumber: string | null;
  invoiceSeries: string | null;
  invoiceStatus: InvoiceStatus;
  isPosted: boolean;
  isDelivered: boolean;
  isInvoiced: boolean;
  contactPerson: string | null;
  salesPersonName: string | null;
  reference: string | null;
  paymentTermDays: number | null;
  dueDate: string | null;
  createdAt: string;
  customer: SalesInvoiceCustomer;
  postedBy: SalesInvoicePostedBy | null;
}

export interface SalesInvoiceDetailRecord {
  id: string;
  sortOrder: number;
  description: string | null;
  qty: string;
  unitPrice: string;
  vatRate: string;
  amount: string;
  item: {
    id: string;
    sku: string;
    name: string;
    unit: string;
    itemType: string;
  };
  warehouse: { id: string; code: string; name: string } | null;
  arAccount: { id: string; code: string; name: string } | null;
  revAccount: { id: string; code: string; name: string } | null;
}

export interface SalesInvoiceFull extends SalesInvoiceListItem {
  invoiceDate: string | null;
  details: SalesInvoiceDetailRecord[];
}

export interface SalesInvoiceListResult {
  total: number;
  page: number;
  limit: number;
  rows: SalesInvoiceListItem[];
}

export interface SalesInvoiceDetailPayload {
  itemId: string;
  warehouseId?: string;
  description?: string;
  qty: number;
  unitPrice: number;
  vatRate: number;
  arAccountId?: string;
  revAccountId?: string;
  sortOrder?: number;
}

export interface SalesInvoicePayload {
  voucherDate: string;
  accountingDate: string;
  customerId: string;
  description?: string;
  isPosted: boolean;
  isDelivered: boolean;
  isInvoiced: boolean;
  invoiceNumber?: string;
  invoiceSeries?: string;
  invoiceDate?: string;
  contactPerson?: string;
  salesPersonName?: string;
  reference?: string;
  paymentTermDays?: number;
  dueDate?: string;
  details: SalesInvoiceDetailPayload[];
}

export type SalesInvoiceUpdatePayload = Partial<SalesInvoicePayload>;

// ─── Invoice Setting ──────────────────────────────────────────────────────────

export interface InvoiceSetting {
  id: string;
  year: number;
  symbol: string;
  templateCode: string;
  startNumber: number;
  currentNumber: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceSettingPayload {
  year: number;
  symbol: string;
  templateCode?: string;
  startNumber?: number;
  isActive?: boolean;
}

export interface VoucherAuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityRef: string | null;
  detail: string | null;
  createdAt: string;
  userEmail: string | null;
  userName: string | null;
  userId: string | null;
}

export interface VoucherAuditLogListResult {
  total: number;
  page: number;
  limit: number;
  rows: VoucherAuditLog[];
}

export interface CustomerDebtRow {
  customerId: string;
  customerCode: string;
  customerName: string;
  address: string | null;
  taxCode: string | null;
  email: string | null;
  reminderEmail: string | null;
  totalByInvoice: string;
  totalPaid: string;
  remaining: string;
  hasOverdue: boolean;
}

export interface ArDebtListResult {
  total: number;
  page: number;
  limit: number;
  rows: CustomerDebtRow[];
}

export interface DebtInvoiceRow {
  invoiceId: string;
  voucherNumber: string;
  invoiceNumber: string | null;
  voucherDate: string;
  dueDate: string | null;
  grandTotal: string;
  overdueDays: number;
}

export interface ArDebtAgingResult {
  notDue_0_30: number;
  notDue_31_60: number;
  notDue_61_90: number;
  notDue_91_120: number;
  notDue_over120: number;
  notDueNoDueDate: number;
  overdue_1_30: number;
  overdue_31_60: number;
  overdue_61_90: number;
  overdue_91_120: number;
  overdue_over120: number;
  normal: number;
  hardToCollect: number;
  impossible: number;
}

export interface ArDebtTransaction {
  id: string;
  accountingDate: string;
  entryNumber: string;
  refType: string;
  description: string;
  debitAmount: string;
  creditAmount: string;
  runningBalance: string;
}

export interface ArDebtDetailResult {
  customer: {
    id: string;
    name: string;
    code: string;
    taxCode: string | null;
    address: string | null;
  };
  invoices: DebtInvoiceRow[];
  aging: ArDebtAgingResult;
  transactions: ArDebtTransaction[];
}

// ─── Purchase Invoice shapes ──────────────────────────────────────────────────

export interface PurchaseInvoiceSupplier {
  id: string;
  code: string;
  name: string;
  address: string | null;
  taxCode: string | null;
}

export interface PurchaseInvoiceListItem {
  id: string;
  voucherNumber: string;
  voucherDate: string;
  accountingDate: string;
  description: string | null;
  totalAmount: string;
  vatAmount: string;
  grandTotal: string;
  invoiceNumber: string | null;
  invoiceSeries: string | null;
  invoiceDate: string | null;
  isPosted: boolean;
  contactPerson: string | null;
  reference: string | null;
  paymentTermDays: number | null;
  dueDate: string | null;
  createdAt: string;
  supplier: PurchaseInvoiceSupplier;
  postedBy: { id: string; fullName: string | null; email: string } | null;
}

export interface PurchaseInvoiceDetailRecord {
  id: string;
  sortOrder: number;
  description: string | null;
  qty: string;
  unitPrice: string;
  vatRate: string;
  amount: string;
  item: {
    id: string;
    sku: string;
    name: string;
    unit: string;
    itemType: string;
  };
  warehouse: { id: string; code: string; name: string } | null;
  apAccount: { id: string; code: string; name: string } | null;
  expAccount: { id: string; code: string; name: string } | null;
}

export interface PurchaseInvoiceFull extends PurchaseInvoiceListItem {
  notes: string | null;
  details: PurchaseInvoiceDetailRecord[];
}

export interface PurchaseInvoiceListResult {
  total: number;
  page: number;
  limit: number;
  rows: PurchaseInvoiceListItem[];
}

export interface PurchaseInvoiceDetailPayload {
  itemId: string;
  warehouseId?: string;
  description?: string;
  qty: number;
  unitPrice: number;
  vatRate: number;
  apAccountId?: string;
  expAccountId?: string;
  sortOrder?: number;
}

export interface PurchaseInvoicePayload {
  voucherDate: string;
  accountingDate: string;
  supplierId: string;
  description?: string;
  isPosted?: boolean;
  invoiceNumber?: string;
  invoiceSeries?: string;
  invoiceDate?: string;
  contactPerson?: string;
  reference?: string;
  paymentTermDays?: number;
  dueDate?: string;
  notes?: string;
  details: PurchaseInvoiceDetailPayload[];
}

export type PurchaseInvoiceUpdatePayload = Partial<PurchaseInvoicePayload>;

// ─── AP Debt shapes ───────────────────────────────────────────────────────────

export interface SupplierDebtRow {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  address: string | null;
  taxCode: string | null;
  email: string | null;
  totalByInvoice: string;
  totalPaid: string;
  remaining: string;
  hasOverdue: boolean;
}

export interface ApDebtListResult {
  total: number;
  page: number;
  limit: number;
  rows: SupplierDebtRow[];
}

export interface ApDebtInvoiceRow {
  invoiceId: string;
  voucherNumber: string;
  invoiceNumber: string | null;
  voucherDate: string;
  dueDate: string | null;
  grandTotal: string;
  overdueDays: number;
}

export interface ApDebtAgingResult {
  notDue_0_30: number;
  notDue_31_60: number;
  notDue_61_90: number;
  notDue_91_120: number;
  notDue_over120: number;
  notDueNoDueDate: number;
  overdue_1_30: number;
  overdue_31_60: number;
  overdue_61_90: number;
  overdue_91_120: number;
  overdue_over120: number;
  normal: number;
  hardToPay: number;
  critical: number;
}

export interface ApDebtDetailResult {
  supplier: {
    id: string;
    name: string;
    code: string;
    taxCode: string | null;
    address: string | null;
  };
  invoices: ApDebtInvoiceRow[];
  aging: ApDebtAgingResult;
}

export interface ReceiptDefaultsResult {
  cashAccounts: { id: string; code: string; name: string }[];
  arAccounts: { id: string; code: string; name: string }[];
  defaultArAccountId: string | null;
}

export interface CreateReceiptLinePayload {
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  description: string;
}

export interface CreateReceiptPayload {
  customerId: string;
  receiptDate: string;
  accountingDate: string;
  submitter?: string;
  reason?: string;
  notes?: string;
  lines: CreateReceiptLinePayload[];
}

export interface PaymentDefaultsResult {
  cashAccounts: { id: string; code: string; name: string }[];
  allAccounts: { id: string; code: string; name: string }[];
  defaultDebitAccountId: string | null;
}

export interface CreatePaymentLinePayload {
  debitAccountId: string; // 331* AP account
  creditAccountId: string; // 111/112 cash/bank
  amount: number;
  description: string;
}

export interface CreatePaymentPayload {
  supplierId: string;
  paymentDate: string;
  accountingDate: string;
  recipient?: string;
  reason?: string;
  notes?: string;
  lines: CreatePaymentLinePayload[];
}

// ── Report interfaces ─────────────────────────────────────────────────────────

export interface LedgerLine {
  id: string;
  accountingDate: string;
  entryNumber: string;
  refType: string;
  docNumber: string | null;
  description: string | null;
  partner: { id: string; code: string; name: string } | null;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
}

export interface LedgerResult {
  account: { id: string; code: string; name: string; normalBalance: string };
  openingDebit: number;
  openingCredit: number;
  openingBalance: number;
  lines: LedgerLine[];
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  total: number;
}

export interface ReconciliationMovement {
  accountingDate: string;
  accountCode: string;
  accountName: string;
  docNumber: string | null;
  refType: string;
  description: string | null;
  debitAmount: number;
  creditAmount: number;
}

export interface ReconciliationResult {
  partner: {
    id: string;
    code: string;
    name: string;
    taxCode: string | null;
    address: string | null;
    phone: string | null;
  };
  accountCodeFilter: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  openingDebit: number;
  openingCredit: number;
  openingBalance: number;
  movements: ReconciliationMovement[];
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

export interface ManagementRow {
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  taxCode: string | null;
  openingBalance: number;
  periodDebit: number;
  periodCredit: number;
  closingBalance: number;
}

export interface ManagementReportResult {
  rows: ManagementRow[];
  totals: {
    openingBalance: number;
    periodDebit: number;
    periodCredit: number;
    closingBalance: number;
  };
  total: number;
  page: number;
  limit: number;
}

export interface PeriodOpeningBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  normalBalance: string;
  debitAmount: number;
  creditAmount: number;
}

export interface PeriodInfo {
  id: string | null;
  year: number;
  month: number;
  status: "OPEN" | "CLOSED";
  closedAt: string | null;
  closedBy: string | null;
  openingBalances: PeriodOpeningBalanceRow[];
}

export interface PeriodListItem {
  id: string;
  year: number;
  month: number;
  status: "OPEN" | "CLOSED";
  closedAt: string | null;
  closedBy: { fullName: string | null; email: string } | null;
}

export interface ClosingPreviewRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  openingBalance: number;
  periodDebit: number;
  periodCredit: number;
  closingBalance: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const optionHeaders = options.headers as Record<string, string> | undefined;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: optionHeaders ? { ...headers, ...optionHeaders } : headers,
  });

  const data = (await res.json()) as ApiResponse<T>;

  if (!res.ok) {
    throw new Error(data.message ?? "Request failed");
  }

  return data;
}

export const api = {
  auth: {
    register: (body: {
      email: string;
      password: string;
      fullName?: string;
      role?: string;
    }) =>
      request<{ userId: string; email: string; profile: UserProfile }>(
        "/api/auth/register",
        { method: "POST", body: JSON.stringify(body) },
      ),

    login: (body: { email: string; password: string }) =>
      request<{
        session: {
          access_token: string;
          refresh_token: string;
          expires_in: number;
        };
        user: Record<string, unknown>;
        profile: UserProfile;
      }>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),

    resendOtp: (body: { email: string }) =>
      request<null>("/api/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    syncProfile: (
      body: {
        fullName?: string;
        avatarUrl?: string;
        provider?: string;
        role?: string;
      },
      accessToken: string,
    ) =>
      request<{ profile: UserProfile }>(
        "/api/auth/sync-profile",
        { method: "POST", body: JSON.stringify(body) },
        accessToken,
      ),

    forgotPassword: (body: { email: string }) =>
      request<null>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    changePassword: (
      body: { currentPassword: string; newPassword: string },
      accessToken: string,
    ) =>
      request<null>(
        "/api/auth/change-password",
        { method: "POST", body: JSON.stringify(body) },
        accessToken,
      ),
  },
  master: {
    listPartners: (
      accessToken: string,
      params?: { q?: string; partnerType?: PartnerType; isActive?: boolean },
    ) => {
      const query = new URLSearchParams();
      if (params?.q) query.set("q", params.q);
      if (params?.partnerType) query.set("partnerType", params.partnerType);
      if (typeof params?.isActive === "boolean") {
        query.set("isActive", String(params.isActive));
      }

      const suffix = query.toString() ? `?${query.toString()}` : "";
      return request<Partner[]>(
        `/api/master/partners${suffix}`,
        {},
        accessToken,
      );
    },
    getPartner: (id: string, accessToken: string) =>
      request<Partner>(`/api/master/partners/${id}`, {}, accessToken),
    createPartner: (body: PartnerPayload, accessToken: string) =>
      request<Partner>(
        "/api/master/partners",
        { method: "POST", body: JSON.stringify(body) },
        accessToken,
      ),
    updatePartner: (
      id: string,
      body: Partial<PartnerPayload>,
      accessToken: string,
    ) =>
      request<Partner>(
        `/api/master/partners/${id}`,
        { method: "PATCH", body: JSON.stringify(body) },
        accessToken,
      ),

    listItems: (
      accessToken: string,
      params?: { q?: string; itemType?: ItemType; isActive?: boolean },
    ) => {
      const query = new URLSearchParams();
      if (params?.q) query.set("q", params.q);
      if (params?.itemType) query.set("itemType", params.itemType);
      if (typeof params?.isActive === "boolean") {
        query.set("isActive", String(params.isActive));
      }

      const suffix = query.toString() ? `?${query.toString()}` : "";
      return request<Item[]>(`/api/master/items${suffix}`, {}, accessToken);
    },
    getItem: (id: string, accessToken: string) =>
      request<Item>(`/api/master/items/${id}`, {}, accessToken),
    createItem: (body: ItemPayload, accessToken: string) =>
      request<Item>(
        "/api/master/items",
        { method: "POST", body: JSON.stringify(body) },
        accessToken,
      ),
    updateItem: (id: string, body: Partial<ItemPayload>, accessToken: string) =>
      request<Item>(
        `/api/master/items/${id}`,
        { method: "PATCH", body: JSON.stringify(body) },
        accessToken,
      ),

    listAccounts: (
      accessToken: string,
      params?: { q?: string; accountType?: AccountType; isActive?: boolean },
    ) => {
      const query = new URLSearchParams();
      if (params?.q) query.set("q", params.q);
      if (params?.accountType) query.set("accountType", params.accountType);
      if (typeof params?.isActive === "boolean") {
        query.set("isActive", String(params.isActive));
      }

      const suffix = query.toString() ? `?${query.toString()}` : "";
      return request<Account[]>(
        `/api/master/accounts${suffix}`,
        {},
        accessToken,
      );
    },
    getAccount: (id: string, accessToken: string) =>
      request<Account>(`/api/master/accounts/${id}`, {}, accessToken),
    createAccount: (body: AccountPayload, accessToken: string) =>
      request<Account>(
        "/api/master/accounts",
        { method: "POST", body: JSON.stringify(body) },
        accessToken,
      ),
    updateAccount: (
      id: string,
      body: Partial<AccountPayload>,
      accessToken: string,
    ) =>
      request<Account>(
        `/api/master/accounts/${id}`,
        { method: "PATCH", body: JSON.stringify(body) },
        accessToken,
      ),
  },

  salesInvoice: {
    list: (
      accessToken: string,
      params?: {
        q?: string;
        dateFrom?: string;
        dateTo?: string;
        isPosted?: boolean;
        isInvoiced?: boolean;
        invoiceStatus?: "DRAFT" | "ISSUED" | "CANCELLED";
        isDelivered?: boolean;
        sortBy?: "accountingDate" | "grandTotal";
        sortDir?: "asc" | "desc";
        page?: number;
        limit?: number;
      },
    ) => {
      const query = new URLSearchParams();
      if (params?.q) query.set("q", params.q);
      if (params?.dateFrom) query.set("dateFrom", params.dateFrom);
      if (params?.dateTo) query.set("dateTo", params.dateTo);
      if (params?.isPosted !== undefined)
        query.set("isPosted", String(params.isPosted));
      if (params?.isInvoiced !== undefined)
        query.set("isInvoiced", String(params.isInvoiced));
      if (params?.isDelivered !== undefined)
        query.set("isDelivered", String(params.isDelivered));
      if (params?.invoiceStatus)
        query.set("invoiceStatus", params.invoiceStatus);
      if (params?.sortBy) query.set("sortBy", params.sortBy);
      if (params?.sortDir) query.set("sortDir", params.sortDir);
      if (params?.page) query.set("page", String(params.page));
      if (params?.limit) query.set("limit", String(params.limit));
      const suffix = query.toString() ? `?${query.toString()}` : "";
      return request<SalesInvoiceListResult>(
        `/api/sales-invoices${suffix}`,
        {},
        accessToken,
      );
    },

    getById: (id: string, accessToken: string) =>
      request<SalesInvoiceFull>(`/api/sales-invoices/${id}`, {}, accessToken),

    create: (body: SalesInvoicePayload, accessToken: string) =>
      request<{ id: string; voucherNumber: string }>(
        "/api/sales-invoices",
        { method: "POST", body: JSON.stringify(body) },
        accessToken,
      ),

    update: (
      id: string,
      body: SalesInvoiceUpdatePayload,
      accessToken: string,
    ) =>
      request<{ id: string; voucherNumber: string }>(
        `/api/sales-invoices/${id}`,
        { method: "PATCH", body: JSON.stringify(body) },
        accessToken,
      ),

    delete: (id: string, accessToken: string) =>
      request<null>(
        `/api/sales-invoices/${id}`,
        { method: "DELETE" },
        accessToken,
      ),

    issueInvoice: (id: string, accessToken: string) =>
      request<{
        id: string;
        voucherNumber: string;
        invoiceNumber: string;
        symbol: string;
      }>(`/api/sales-invoices/${id}/issue`, { method: "PATCH" }, accessToken),

    nextInvoiceNumber: (accessToken: string) =>
      request<{ invoiceNumber: string }>(
        "/api/sales-invoices/next-invoice-number",
        {},
        accessToken,
      ),

    getSendDefaults: (id: string, accessToken: string) =>
      request<{ suggestedTo: string; suggestedCc: string[] }>(
        `/api/sales-invoices/${id}/send-defaults`,
        {},
        accessToken,
      ),

    sendEmail: (
      id: string,
      body: { to: string; cc?: string[]; note?: string },
      accessToken: string,
    ) =>
      request<null>(
        `/api/sales-invoices/${id}/send`,
        { method: "POST", body: JSON.stringify(body) },
        accessToken,
      ),
  },

  invoiceSetting: {
    list: (accessToken: string, year?: number) => {
      const suffix = year ? `?year=${year}` : "";
      return request<InvoiceSetting[]>(
        `/api/invoice-settings${suffix}`,
        {},
        accessToken,
      );
    },
    getById: (id: string, accessToken: string) =>
      request<InvoiceSetting>(`/api/invoice-settings/${id}`, {}, accessToken),
    create: (body: InvoiceSettingPayload, accessToken: string) =>
      request<InvoiceSetting>(
        "/api/invoice-settings",
        { method: "POST", body: JSON.stringify(body) },
        accessToken,
      ),
    update: (
      id: string,
      body: Partial<
        Pick<
          InvoiceSettingPayload,
          "symbol" | "templateCode" | "startNumber" | "isActive"
        >
      >,
      accessToken: string,
    ) =>
      request<InvoiceSetting>(
        `/api/invoice-settings/${id}`,
        { method: "PATCH", body: JSON.stringify(body) },
        accessToken,
      ),
    delete: (id: string, accessToken: string) =>
      request<null>(
        `/api/invoice-settings/${id}`,
        { method: "DELETE" },
        accessToken,
      ),
  },

  voucherAuditLog: {
    list: (
      accessToken: string,
      params?: {
        q?: string;
        action?: string;
        entityType?: string;
        entityId?: string;
        userId?: string;
        dateFrom?: string;
        dateTo?: string;
        page?: number;
        limit?: number;
      },
    ) => {
      const p = new URLSearchParams();
      if (params?.q) p.set("q", params.q);
      if (params?.action) p.set("action", params.action);
      if (params?.entityType) p.set("entityType", params.entityType);
      if (params?.entityId) p.set("entityId", params.entityId);
      if (params?.userId) p.set("userId", params.userId);
      if (params?.dateFrom) p.set("dateFrom", params.dateFrom);
      if (params?.dateTo) p.set("dateTo", params.dateTo);
      if (params?.page) p.set("page", String(params.page));
      if (params?.limit) p.set("limit", String(params.limit));
      const suffix = p.toString() ? `?${p.toString()}` : "";
      return request<VoucherAuditLogListResult>(
        `/api/voucher-audit-logs${suffix}`,
        {},
        accessToken,
      );
    },
  },

  arDebt: {
    list: (
      accessToken: string,
      params?: {
        q?: string;
        dateFrom?: string;
        dateTo?: string;
        overdueOnly?: boolean;
        page?: number;
        limit?: number;
      },
    ) => {
      const p = new URLSearchParams();
      if (params?.q) p.set("q", params.q);
      if (params?.dateFrom) p.set("dateFrom", params.dateFrom);
      if (params?.dateTo) p.set("dateTo", params.dateTo);
      if (params?.overdueOnly) p.set("overdueOnly", "true");
      if (params?.page) p.set("page", String(params.page));
      if (params?.limit) p.set("limit", String(params.limit));
      const suffix = p.toString() ? `?${p.toString()}` : "";
      return request<ArDebtListResult>(
        `/api/ar-debts${suffix}`,
        {},
        accessToken,
      );
    },
    detail: (customerId: string, accessToken: string) =>
      request<ArDebtDetailResult>(
        `/api/ar-debts/${customerId}`,
        {},
        accessToken,
      ),
    remind: (customerId: string, accessToken: string) =>
      request<null>(
        `/api/ar-debts/${customerId}/remind`,
        { method: "POST" },
        accessToken,
      ),
  },
  receipt: {
    getDefaults: (customerId: string, accessToken: string) =>
      request<ReceiptDefaultsResult>(
        `/api/receipts/defaults/${customerId}`,
        {},
        accessToken,
      ),
    create: (body: CreateReceiptPayload, accessToken: string) =>
      request<{ id: string; receiptNumber: string }>(
        "/api/receipts",
        { method: "POST", body: JSON.stringify(body) },
        accessToken,
      ),
  },

  payment: {
    getDefaults: (supplierId: string, accessToken: string) =>
      request<PaymentDefaultsResult>(
        `/api/payments/defaults/${supplierId}`,
        {},
        accessToken,
      ),
    create: (body: CreatePaymentPayload, accessToken: string) =>
      request<{ id: string; paymentNumber: string }>(
        "/api/payments",
        { method: "POST", body: JSON.stringify(body) },
        accessToken,
      ),
  },

  purchaseInvoice: {
    list: (
      accessToken: string,
      params?: {
        q?: string;
        dateFrom?: string;
        dateTo?: string;
        supplierId?: string;
        isPosted?: boolean;
        sortBy?: "accountingDate" | "grandTotal";
        sortDir?: "asc" | "desc";
        page?: number;
        limit?: number;
      },
    ) => {
      const p = new URLSearchParams();
      if (params?.q) p.set("q", params.q);
      if (params?.dateFrom) p.set("dateFrom", params.dateFrom);
      if (params?.dateTo) p.set("dateTo", params.dateTo);
      if (params?.supplierId) p.set("supplierId", params.supplierId);
      if (params?.isPosted !== undefined)
        p.set("isPosted", String(params.isPosted));
      if (params?.sortBy) p.set("sortBy", params.sortBy);
      if (params?.sortDir) p.set("sortDir", params.sortDir);
      if (params?.page) p.set("page", String(params.page));
      if (params?.limit) p.set("limit", String(params.limit));
      const suffix = p.toString() ? `?${p.toString()}` : "";
      return request<PurchaseInvoiceListResult>(
        `/api/purchase-invoices${suffix}`,
        {},
        accessToken,
      );
    },

    getById: (id: string, accessToken: string) =>
      request<PurchaseInvoiceFull>(
        `/api/purchase-invoices/${id}`,
        {},
        accessToken,
      ),

    create: (body: PurchaseInvoicePayload, accessToken: string) =>
      request<{ id: string; voucherNumber: string }>(
        "/api/purchase-invoices",
        { method: "POST", body: JSON.stringify(body) },
        accessToken,
      ),

    update: (
      id: string,
      body: PurchaseInvoiceUpdatePayload,
      accessToken: string,
    ) =>
      request<{ id: string; voucherNumber: string }>(
        `/api/purchase-invoices/${id}`,
        { method: "PATCH", body: JSON.stringify(body) },
        accessToken,
      ),

    delete: (id: string, accessToken: string) =>
      request<null>(
        `/api/purchase-invoices/${id}`,
        { method: "DELETE" },
        accessToken,
      ),

    post: (id: string, accessToken: string) =>
      request<{ id: string; voucherNumber: string }>(
        `/api/purchase-invoices/${id}/post`,
        { method: "PATCH" },
        accessToken,
      ),
  },

  apDebt: {
    list: (
      accessToken: string,
      params?: {
        q?: string;
        dateFrom?: string;
        dateTo?: string;
        overdueOnly?: boolean;
        page?: number;
        limit?: number;
      },
    ) => {
      const p = new URLSearchParams();
      if (params?.q) p.set("q", params.q);
      if (params?.dateFrom) p.set("dateFrom", params.dateFrom);
      if (params?.dateTo) p.set("dateTo", params.dateTo);
      if (params?.overdueOnly) p.set("overdueOnly", "true");
      if (params?.page) p.set("page", String(params.page));
      if (params?.limit) p.set("limit", String(params.limit));
      const suffix = p.toString() ? `?${p.toString()}` : "";
      return request<ApDebtListResult>(
        `/api/ap-debts${suffix}`,
        {},
        accessToken,
      );
    },
    detail: (supplierId: string, accessToken: string) =>
      request<ApDebtDetailResult>(
        `/api/ap-debts/${supplierId}`,
        {},
        accessToken,
      ),
  },

  reminderConfig: {
    get: (partnerId: string, accessToken: string) =>
      request<DebtReminderConfig[]>(
        `/api/reminder-configs/${partnerId}`,
        {},
        accessToken,
      ),

    upsert: (
      partnerId: string,
      body: ReminderConfigPayload,
      accessToken: string,
    ) =>
      request<DebtReminderConfig>(
        `/api/reminder-configs/${partnerId}`,
        { method: "PUT", body: JSON.stringify(body) },
        accessToken,
      ),

    delete: (partnerId: string, scope: string, accessToken: string) =>
      request<null>(
        `/api/reminder-configs/${partnerId}/${scope}`,
        { method: "DELETE" },
        accessToken,
      ),

    getSettings: (accessToken: string) =>
      request<GlobalReminderSettings>(
        "/api/reminder-configs/settings",
        {},
        accessToken,
      ),

    updateSettings: (body: UpdateGlobalReminderPayload, accessToken: string) =>
      request<GlobalReminderSettings>(
        "/api/reminder-configs/settings",
        { method: "PUT", body: JSON.stringify(body) },
        accessToken,
      ),

    getLogs: (accessToken: string, limit?: number) => {
      const suffix = limit ? `?limit=${limit}` : "";
      return request<ReminderLog[]>(
        `/api/reminder-configs/logs${suffix}`,
        {},
        accessToken,
      );
    },

    runNow: (accessToken: string) =>
      request<{
        sent: number;
        skipped: number;
        errors: number;
        details: { partnerCode: string; result: string }[];
      }>("/api/reminder-configs/run-now", { method: "POST" }, accessToken),
  },

  report: {
    getLedger: (
      params: { accountId: string; dateFrom?: string; dateTo?: string },
      accessToken: string,
    ) => {
      const p = new URLSearchParams({ accountId: params.accountId });
      if (params.dateFrom) p.set("dateFrom", params.dateFrom);
      if (params.dateTo) p.set("dateTo", params.dateTo);
      return request<LedgerResult>(
        `/api/reports/ledger?${p.toString()}`,
        {},
        accessToken,
      );
    },

    getReconciliation: (
      params: {
        partnerId: string;
        accountCode?: string;
        dateFrom?: string;
        dateTo?: string;
      },
      accessToken: string,
    ) => {
      const p = new URLSearchParams({ partnerId: params.partnerId });
      if (params.accountCode) p.set("accountCode", params.accountCode);
      if (params.dateFrom) p.set("dateFrom", params.dateFrom);
      if (params.dateTo) p.set("dateTo", params.dateTo);
      return request<ReconciliationResult>(
        `/api/reports/reconciliation?${p.toString()}`,
        {},
        accessToken,
      );
    },

    getManagement: (
      params: {
        accountCode: string;
        dateFrom?: string;
        dateTo?: string;
        q?: string;
        page?: number;
        limit?: number;
      },
      accessToken: string,
    ) => {
      const p = new URLSearchParams({ accountCode: params.accountCode });
      if (params.dateFrom) p.set("dateFrom", params.dateFrom);
      if (params.dateTo) p.set("dateTo", params.dateTo);
      if (params.q) p.set("q", params.q);
      if (params.page) p.set("page", String(params.page));
      if (params.limit) p.set("limit", String(params.limit));
      return request<ManagementReportResult>(
        `/api/reports/management?${p.toString()}`,
        {},
        accessToken,
      );
    },
  },

  period: {
    list: (accessToken: string) =>
      request<PeriodListItem[]>("/api/periods", {}, accessToken),

    getInfo: (year: number, month: number, accessToken: string) =>
      request<PeriodInfo>(`/api/periods/${year}/${month}`, {}, accessToken),

    saveBalances: (
      year: number,
      month: number,
      balances: {
        accountId: string;
        debitAmount: number;
        creditAmount: number;
      }[],
      accessToken: string,
    ) =>
      request<null>(
        `/api/periods/${year}/${month}/balances`,
        {
          method: "PUT",
          body: JSON.stringify({ balances }),
        },
        accessToken,
      ),

    getClosingPreview: (year: number, month: number, accessToken: string) =>
      request<ClosingPreviewRow[]>(
        `/api/periods/${year}/${month}/preview`,
        {},
        accessToken,
      ),

    close: (year: number, month: number, accessToken: string) =>
      request<{ nextYear: number; nextMonth: number; accountsCarried: number }>(
        `/api/periods/${year}/${month}/close`,
        { method: "POST" },
        accessToken,
      ),
  },
};

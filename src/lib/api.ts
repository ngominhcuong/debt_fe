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
      return request<Partner[]>(`/api/master/partners${suffix}`, {}, accessToken);
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
    updateItem: (
      id: string,
      body: Partial<ItemPayload>,
      accessToken: string,
    ) =>
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
      return request<Account[]>(`/api/master/accounts${suffix}`, {}, accessToken);
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
};

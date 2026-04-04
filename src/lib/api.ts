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
};

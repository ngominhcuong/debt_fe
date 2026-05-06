import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageToolbar from "@/components/shared/PageToolbar";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { api, UserProfile } from "@/lib/api";

const PAGE_SIZE = 20;

const ROLE_LABEL: Record<string, string> = {
  CHIEF_ACCOUNTANT: "Kế toán trưởng",
  STAFF_ACCOUNTANT: "Kế toán viên",
};

const PROVIDER_LABEL: Record<string, string> = {
  EMAIL: "Email",
  GOOGLE: "Google",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const columns: Column<UserProfile>[] = [
  {
    key: "id",
    header: "ID",
    render: (u) => <span className="font-mono text-xs">{u.id}</span>,
  },
  {
    key: "fullName",
    header: "Họ tên",
    className: "font-medium",
    render: (u) =>
      u.fullName ?? <span className="text-muted-foreground italic">—</span>,
  },
  { key: "email", header: "Email" },
  {
    key: "role",
    header: "Vai trò",
    render: (u) => (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
        {ROLE_LABEL[u.role] ?? u.role}
      </span>
    ),
  },
  {
    key: "provider",
    header: "Đăng nhập qua",
    render: (u) => PROVIDER_LABEL[u.provider] ?? u.provider,
  },
  {
    key: "avatarUrl",
    header: "Avatar",
    render: (u) =>
      u.avatarUrl ? (
        <a
          href={u.avatarUrl}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          Xem ảnh
        </a>
      ) : (
        <span className="text-muted-foreground italic">—</span>
      ),
  },
  {
    key: "isEmailVerified",
    header: "Trạng thái",
    render: (u) => (
      <StatusBadge status={u.isEmailVerified ? "active" : "inactive"} />
    ),
  },
  {
    key: "createdAt",
    header: "Ngày tạo",
    render: (u) => fmtDate(u.createdAt),
  },
  {
    key: "updatedAt",
    header: "Cập nhật cuối",
    render: (u) => fmtDate(u.updatedAt),
  },
];

export default function UsersPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const params = {
    q: q || undefined,
    role:
      roleFilter === "ALL"
        ? undefined
        : (roleFilter as "CHIEF_ACCOUNTANT" | "STAFF_ACCOUNTANT"),
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["auth-users", params],
    queryFn: () => api.auth.listUsers(token, params).then((res) => res.data),
    enabled: !!token,
  });

  const rows: UserProfile[] = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  let tableContent: React.ReactNode;
  if (isLoading) {
    tableContent = (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Đang tải...
      </div>
    );
  } else if (isError) {
    tableContent = (
      <div className="text-sm text-destructive py-8 text-center">
        {error instanceof Error
          ? error.message
          : "Không tải được dữ liệu người dùng"}
      </div>
    );
  } else {
    tableContent = <DataTable columns={columns} data={rows} />;
  }

  return (
    <>
      <PageToolbar onAdd={() => {}} addLabel="Thêm người dùng" />

      <div className="flex flex-wrap gap-2 mb-4">
        <Input
          placeholder="Tìm tên, email..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className="h-8 w-64 text-sm"
        />
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-44 text-sm">
            <SelectValue placeholder="Vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả vai trò</SelectItem>
            <SelectItem value="CHIEF_ACCOUNTANT">Kế toán trưởng</SelectItem>
            <SelectItem value="STAFF_ACCOUNTANT">Kế toán viên</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tableContent}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>
            {total} người dùng · Trang {page}/{totalPages}
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded border text-xs disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Trước
            </button>
            <button
              className="px-3 py-1 rounded border text-xs disabled:opacity-40"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </>
  );
}

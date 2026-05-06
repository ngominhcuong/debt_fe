import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import PageToolbar from "@/components/shared/PageToolbar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { api, VoucherAuditLog } from "@/lib/api";

const PAGE_SIZE = 20;

const ACTION_LABEL: Record<string, string> = {
  CREATE: "Thêm mới",
  UPDATE: "Cập nhật",
  DELETE: "Xóa",
  ISSUE: "Phát hành HĐ",
  CREATE_SALES_INVOICE: "Tạo chứng từ bán hàng",
  UPDATE_SALES_INVOICE: "Cập nhật chứng từ bán hàng",
  DELETE_SALES_INVOICE: "Xóa chứng từ bán hàng",
  ISSUE_SALES_INVOICE: "Phát hành hóa đơn bán ra",
  CREATE_RECEIPT: "Lập phiếu thu",
  CREATE_PAYMENT: "Lập phiếu chi",
  SEND_DEBT_REMINDER: "Gửi nhắc nợ",
  AUTO_DEBT_REMINDER: "Nhắc nợ tự động",
  SEND_EMAIL: "Gửi email",
};

const ACTION_COLOR: Record<string, string> = {
  CREATE: "bg-success/15 text-success",
  UPDATE: "bg-info/15 text-info",
  DELETE: "bg-destructive/15 text-destructive",
  ISSUE: "bg-purple-500/15 text-purple-600",
  CREATE_SALES_INVOICE: "bg-success/15 text-success",
  UPDATE_SALES_INVOICE: "bg-info/15 text-info",
  DELETE_SALES_INVOICE: "bg-destructive/15 text-destructive",
  ISSUE_SALES_INVOICE: "bg-purple-500/15 text-purple-600",
  CREATE_RECEIPT: "bg-emerald-500/15 text-emerald-600",
  CREATE_PAYMENT: "bg-cyan-500/15 text-cyan-700",
  SEND_DEBT_REMINDER: "bg-amber-500/15 text-amber-700",
  AUTO_DEBT_REMINDER: "bg-orange-500/15 text-orange-700",
  SEND_EMAIL: "bg-sky-500/15 text-sky-700",
};

const ACTION_OPTIONS = [
  { value: "CREATE", label: ACTION_LABEL.CREATE },
  { value: "UPDATE", label: ACTION_LABEL.UPDATE },
  { value: "DELETE", label: ACTION_LABEL.DELETE },
  { value: "ISSUE", label: ACTION_LABEL.ISSUE },
  {
    value: "CREATE_SALES_INVOICE",
    label: ACTION_LABEL.CREATE_SALES_INVOICE,
  },
  {
    value: "UPDATE_SALES_INVOICE",
    label: ACTION_LABEL.UPDATE_SALES_INVOICE,
  },
  {
    value: "DELETE_SALES_INVOICE",
    label: ACTION_LABEL.DELETE_SALES_INVOICE,
  },
  {
    value: "ISSUE_SALES_INVOICE",
    label: ACTION_LABEL.ISSUE_SALES_INVOICE,
  },
  { value: "CREATE_RECEIPT", label: ACTION_LABEL.CREATE_RECEIPT },
  { value: "CREATE_PAYMENT", label: ACTION_LABEL.CREATE_PAYMENT },
  {
    value: "SEND_DEBT_REMINDER",
    label: ACTION_LABEL.SEND_DEBT_REMINDER,
  },
  {
    value: "AUTO_DEBT_REMINDER",
    label: ACTION_LABEL.AUTO_DEBT_REMINDER,
  },
  { value: "SEND_EMAIL", label: ACTION_LABEL.SEND_EMAIL },
];

function fmtDatetime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function AuditLogPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const params = {
    q: q || undefined,
    action: actionFilter === "ALL" ? undefined : actionFilter,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["voucher-audit-logs", params],
    queryFn: () =>
      api.voucherAuditLog.list(token, params).then((res) => res.data),
    enabled: !!token,
  });

  const rows: VoucherAuditLog[] = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const skeletonRows = [
    "srow-1",
    "srow-2",
    "srow-3",
    "srow-4",
    "srow-5",
    "srow-6",
    "srow-7",
    "srow-8",
  ];
  const skeletonCols = [
    "scol-1",
    "scol-2",
    "scol-3",
    "scol-4",
    "scol-5",
    "scol-6",
    "scol-7",
  ];

  let tableBody: React.ReactNode;
  if (isLoading) {
    tableBody = skeletonRows.map((rowKey) => (
      <tr key={rowKey} className="border-t border-border/50">
        {skeletonCols.map((colKey) => (
          <td key={`${rowKey}-${colKey}`} className="px-4 py-2.5">
            <Skeleton className="h-4 w-full" />
          </td>
        ))}
      </tr>
    ));
  } else if (isError) {
    tableBody = (
      <tr>
        <td
          colSpan={7}
          className="px-4 py-8 text-center text-destructive text-sm"
        >
          {error instanceof Error
            ? error.message
            : "Không tải được nhật ký hệ thống"}
        </td>
      </tr>
    );
  } else if (rows.length === 0) {
    tableBody = (
      <tr>
        <td
          colSpan={7}
          className="px-4 py-8 text-center text-muted-foreground text-sm"
        >
          Không có dữ liệu
        </td>
      </tr>
    );
  } else {
    tableBody = rows.map((log) => (
      <tr
        key={log.id}
        className="border-t border-border/50 hover:bg-secondary/20"
      >
        <td className="px-4 py-2.5 font-mono text-xs">
          <div>{log.id}</div>
          <div className="text-muted-foreground">
            {fmtDatetime(log.createdAt)}
          </div>
        </td>
        <td className="px-4 py-2.5">
          <div className="font-medium">{log.userName ?? "—"}</div>
          <div className="text-muted-foreground text-xs">
            {log.userEmail ?? "—"}
          </div>
        </td>
        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
          {log.userId ?? "—"}
        </td>
        <td className="px-4 py-2.5">
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLOR[log.action] ?? "bg-muted text-muted-foreground"}`}
          >
            {ACTION_LABEL[log.action] ?? log.action}
          </span>
        </td>
        <td className="px-4 py-2.5 text-xs text-muted-foreground">
          {log.entityType}
        </td>
        <td className="px-4 py-2.5">
          {log.entityId ? (
            <Link
              to={`/sales/invoices/${log.entityId}`}
              className="text-primary hover:underline"
            >
              {log.entityRef ?? log.entityId}
            </Link>
          ) : (
            <span className="text-muted-foreground">
              {log.entityRef ?? "—"}
            </span>
          )}
          <div className="text-xs text-muted-foreground font-mono mt-1">
            {log.entityId ?? "—"}
          </div>
        </td>
        <td className="px-4 py-2.5 text-muted-foreground">
          {log.detail ?? "—"}
        </td>
      </tr>
    ));
  }

  return (
    <>
      <PageToolbar onExport={() => {}} />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Input
          placeholder="Tìm số chứng từ, người dùng..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className="h-8 w-64 text-sm"
        />
        <Select
          value={actionFilter}
          onValueChange={(v) => {
            setActionFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-44 text-sm">
            <SelectValue placeholder="Hành động" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả hành động</SelectItem>
            {ACTION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-4 py-3 w-44">Log ID / Thời gian</th>
              <th className="text-left px-4 py-3 w-48">Người dùng</th>
              <th className="text-left px-4 py-3 w-44">User ID</th>
              <th className="text-left px-4 py-3 w-36">Hành động</th>
              <th className="text-left px-4 py-3 w-32">Loại chứng từ</th>
              <th className="text-left px-4 py-3 w-52">Đối tượng</th>
              <th className="text-left px-4 py-3">Chi tiết</th>
            </tr>
          </thead>
          <tbody>{tableBody}</tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-1.5 border border-border border-t-0 rounded-b-lg bg-card flex items-center justify-between text-xs text-muted-foreground">
          <span>{total} bản ghi</span>
          <div className="flex items-center gap-2">
            <span>
              Trang {page}/{totalPages} — {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, total)} / {total}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ‹
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                ›
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

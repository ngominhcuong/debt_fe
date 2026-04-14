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
};

const ACTION_COLOR: Record<string, string> = {
  CREATE: "bg-success/15 text-success",
  UPDATE: "bg-info/15 text-info",
  DELETE: "bg-destructive/15 text-destructive",
  ISSUE: "bg-purple-500/15 text-purple-600",
};

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
    action: actionFilter !== "ALL" ? actionFilter : undefined,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["voucher-audit-logs", params],
    queryFn: () => api.voucherAuditLog.list(token, params),
    enabled: !!token,
  });

  const rows: VoucherAuditLog[] = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

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
            <SelectItem value="CREATE">Thêm mới</SelectItem>
            <SelectItem value="UPDATE">Cập nhật</SelectItem>
            <SelectItem value="DELETE">Xóa</SelectItem>
            <SelectItem value="ISSUE">Phát hành HĐ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-4 py-3 w-40">Thời gian</th>
              <th className="text-left px-4 py-3 w-40">Người dùng</th>
              <th className="text-left px-4 py-3 w-36">Hành động</th>
              <th className="text-left px-4 py-3 w-44">Đối tượng</th>
              <th className="text-left px-4 py-3">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-t border-border/50">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-4 py-2.5">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground text-sm"
                >
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              rows.map((log) => (
                <tr
                  key={log.id}
                  className="border-t border-border/50 hover:bg-secondary/20"
                >
                  <td className="px-4 py-2.5 font-mono text-xs">
                    {fmtDatetime(log.createdAt)}
                  </td>
                  <td className="px-4 py-2.5 font-medium">
                    {log.userName ?? log.userEmail ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLOR[log.action] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {ACTION_LABEL[log.action] ?? log.action}
                    </span>
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
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {log.detail ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
          <span>
            {total} bản ghi &bull; Trang {page}/{totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

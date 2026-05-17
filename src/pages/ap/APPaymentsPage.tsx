import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2, Search, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api, type PaymentListRow } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function fmtVND(value: string) {
  const n = Number.parseFloat(value);
  return Number.isNaN(n) ? "0" : new Intl.NumberFormat("vi-VN").format(n);
}

export default function APPaymentsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const handle = globalThis.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => globalThis.clearTimeout(handle);
  }, [search]);

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["payments", token, debouncedSearch, dateFrom, dateTo],
    queryFn: () =>
      api.payment.list(token, {
        q: debouncedSearch || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page: 1,
        limit: 100,
      }),
    enabled: !!token,
    staleTime: 30_000,
  });

  const rows = response?.data.rows ?? [];

  const grandTotalSum = rows.reduce(
    (sum, row) => sum + Number.parseFloat(row.totalAmount),
    0,
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Số CT, nhà cung cấp, người nhận..."
              className="pl-8 h-8 w-60 text-xs"
            />
          </div>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-8 w-32 text-xs"
            aria-label="Từ ngày"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-8 w-32 text-xs"
            aria-label="Đến ngày"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              setSearch("");
              setDateFrom("");
              setDateTo("");
              setSelectedId(null);
            }}
          >
            Xóa lọc
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Làm mới"
            onClick={() => refetch()}
          >
            <RefreshCw size={15} />
          </Button>
          <Button
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={() => navigate("/ap/debts")}
          >
            <Plus size={14} />
            Lập phiếu chi
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Đang tải phiếu chi...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-destructive">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm">Không tải được danh sách phiếu chi</p>
          <Button size="sm" variant="outline" onClick={() => void refetch()}>
            Thử lại
          </Button>
        </div>
      ) : (
        /* Table */
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap w-36">
                  Số chứng từ
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap w-28">
                  Ngày chi
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap w-28">
                  Ngày HT
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">
                  Nhà cung cấp
                </th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground text-xs whitespace-nowrap w-32">
                  Số tiền (VNĐ)
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap w-28">
                  Người nhận
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">
                  Lý do
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-12 text-center text-muted-foreground text-sm"
                  >
                    Không có dữ liệu.{" "}
                    <button
                      type="button"
                      className="text-primary underline hover:no-underline"
                      onClick={() => navigate("/ap/debts")}
                    >
                      Lập phiếu chi
                    </button>{" "}
                    để tạo chứng từ đầu tiên.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                    className={`border-b border-border/50 cursor-pointer transition-colors hover:bg-muted/40 ${
                      selectedId === row.id
                        ? "bg-primary/5 border-l-2 border-l-primary"
                        : ""
                    }`}
                  >
                    <td className="px-3 py-2">
                      <span
                        className="text-primary font-medium text-xs hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/ap/payments/${row.id}`);
                        }}
                      >
                        {row.paymentNumber}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {fmtDate(row.paymentDate)}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {fmtDate(row.accountingDate)}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {row.supplier.code} - {row.supplier.name}
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-mono font-medium">
                      {fmtVND(row.totalAmount)}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {row.recipient ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {row.reason ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="sticky bottom-0 bg-muted/90 backdrop-blur-sm">
                <tr className="border-t-2 border-border font-semibold text-xs">
                  <td className="px-3 py-2" colSpan={2}>
                    Tổng: {rows.length} phiếu chi
                  </td>
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2 text-right font-mono">
                    {fmtVND(grandTotalSum.toString())}
                  </td>
                  <td className="px-3 py-2" colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}

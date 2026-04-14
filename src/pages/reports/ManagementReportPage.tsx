import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import PageToolbar from "@/components/shared/PageToolbar";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtVND(val: number): string {
  if (val === 0) return "—";
  return new Intl.NumberFormat("vi-VN").format(Math.round(val));
}

function fmtBalance(val: number) {
  if (val < 0)
    return <span className="text-destructive">({fmtVND(Math.abs(val))})</span>;
  return <>{fmtVND(val)}</>;
}

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function ManagementReportPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  const [accountCode, setAccountCode] = useState("131");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [searched, setSearched] = useState(false);

  const reportQuery = useQuery({
    queryKey: [
      "management-report",
      accountCode,
      dateFrom,
      dateTo,
      q,
      page,
      token,
    ],
    queryFn: () =>
      api.report
        .getManagement(
          {
            accountCode,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            q: q || undefined,
            page,
            limit: PAGE_SIZE,
          },
          token,
        )
        .then((r) => r.data),
    enabled: searched && !!token,
    staleTime: 30_000,
  });

  const result = reportQuery.data;
  const totalPages = result ? Math.ceil(result.total / result.limit) : 1;

  function handleSearch() {
    setPage(1);
    setSearched(true);
    reportQuery.refetch();
  }

  return (
    <>
      <PageToolbar onExport={() => window.print()} />

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div>
          <Label className="text-xs mb-1 block">Loại công nợ</Label>
          <Select value={accountCode} onValueChange={setAccountCode}>
            <SelectTrigger className="h-8 text-sm w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="131" className="text-xs">
                131 — Phải thu KH
              </SelectItem>
              <SelectItem value="331" className="text-xs">
                331 — Phải trả NCC
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs mb-1 block">Từ ngày</Label>
          <Input
            type="date"
            className="h-8 text-sm w-36"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Đến ngày</Label>
          <Input
            type="date"
            className="h-8 text-sm w-36"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <div className="flex-1 min-w-[180px]">
          <Label className="text-xs mb-1 block">Tìm đối tác</Label>
          <Input
            className="h-8 text-sm"
            placeholder="Mã hoặc tên đối tác..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>

        <Button size="sm" className="h-8 gap-1.5" onClick={handleSearch}>
          {reportQuery.isFetching ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Search size={13} />
          )}
          Tra cứu
        </Button>
      </div>

      {/* ── Empty state ── */}
      {!searched && (
        <div className="flex flex-col items-center justify-center text-muted-foreground py-16 text-sm gap-1">
          <ChevronLeft size={32} className="opacity-30" />
          Chọn loại công nợ và nhấn "Tra cứu" để xem báo cáo tổng hợp
        </div>
      )}

      {reportQuery.isFetching && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-sm">
          <Loader2 className="animate-spin" size={18} /> Đang tải...
        </div>
      )}

      {/* ── Table ── */}
      {result && !reportQuery.isFetching && (
        <>
          <div className="bg-card rounded-lg border border-border overflow-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="bg-muted/60 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <th className="text-left px-3 py-2 w-28">Mã ĐT</th>
                  <th className="text-left px-3 py-2">Tên đối tác</th>
                  <th className="text-left px-3 py-2 w-32">Mã số thuế</th>
                  <th className="text-right px-3 py-2 w-36">Dư đầu kỳ</th>
                  <th className="text-right px-3 py-2 w-32">PS Nợ</th>
                  <th className="text-right px-3 py-2 w-32">PS Có</th>
                  <th className="text-right px-3 py-2 w-36">Dư cuối kỳ</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-8 text-xs text-muted-foreground"
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  result.rows.map((row) => (
                    <tr
                      key={row.partnerId}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-3 py-2 font-medium text-primary text-xs">
                        {row.partnerCode}
                      </td>
                      <td className="px-3 py-2 text-xs">{row.partnerName}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {row.taxCode ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {fmtBalance(row.openingBalance)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {fmtVND(row.periodDebit)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {fmtVND(row.periodCredit)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs font-semibold">
                        {fmtBalance(row.closingBalance)}
                      </td>
                    </tr>
                  ))
                )}

                {/* Totals */}
                {result.rows.length > 0 && (
                  <tr className="bg-muted/30 font-semibold border-t-2 border-border/60">
                    <td className="px-3 py-2 text-xs" colSpan={3}>
                      Tổng cộng
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {fmtBalance(result.totals.openingBalance)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {fmtVND(result.totals.periodDebit)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {fmtVND(result.totals.periodCredit)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs font-bold">
                      {fmtBalance(result.totals.closingBalance)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>
                {result.total} đối tác — trang {result.page}/{totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={13} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={13} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

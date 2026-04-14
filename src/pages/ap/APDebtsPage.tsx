import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  RefreshCw,
  Filter,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  api,
  type SupplierDebtRow,
  type ApDebtInvoiceRow,
  type ApDebtAgingResult,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import APPaymentDialog from "./APPaymentDialog";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtVND(val: string | number | null | undefined): string {
  const n = typeof val === "string" ? Number(val) : (val ?? 0);
  return Number.isNaN(n) ? "0" : new Intl.NumberFormat("vi-VN").format(n);
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function debtStatus(overdueDays: number): { label: string; cls: string } {
  if (overdueDays <= 0) return { label: "Chưa đến hạn", cls: "text-green-600" };
  if (overdueDays <= 90)
    return { label: "Nợ bình thường", cls: "text-foreground" };
  if (overdueDays <= 360)
    return { label: "Nợ khó trả", cls: "text-amber-600 font-medium" };
  return { label: "Nợ lâu năm", cls: "text-destructive font-medium" };
}

// ─── Aging panel ─────────────────────────────────────────────────────────────

function AgingPanel({ aging }: Readonly<{ aging: ApDebtAgingResult }>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="border rounded-lg p-4 space-y-1.5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Nợ trước hạn
        </h4>
        {[
          ["Trước hạn 0 – 30 ngày", aging.notDue_0_30],
          ["Trước hạn 31 – 60 ngày", aging.notDue_31_60],
          ["Trước hạn 61 – 90 ngày", aging.notDue_61_90],
          ["Trước hạn 91 – 120 ngày", aging.notDue_91_120],
          ["Trước hạn trên 120 ngày", aging.notDue_over120],
          ["Không có hạn nợ", aging.notDueNoDueDate],
        ].map(([label, val]) => (
          <div key={String(label)} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono font-medium">
              {fmtVND(val as number)}
            </span>
          </div>
        ))}
      </div>

      <div className="border rounded-lg p-4 space-y-1.5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Nợ quá hạn
        </h4>
        {[
          ["Quá hạn 1 – 30 ngày", aging.overdue_1_30],
          ["Quá hạn 31 – 60 ngày", aging.overdue_31_60],
          ["Quá hạn 61 – 90 ngày", aging.overdue_61_90],
          ["Quá hạn 91 – 120 ngày", aging.overdue_91_120],
          ["Quá hạn trên 120 ngày", aging.overdue_over120],
        ].map(([label, val]) => (
          <div key={String(label)} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span
              className={`font-mono font-medium ${(val as number) > 0 ? "text-destructive" : ""}`}
            >
              {fmtVND(val as number)}
            </span>
          </div>
        ))}
      </div>

      <div className="border rounded-lg p-4 space-y-1.5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Tình trạng nợ
        </h4>
        {(
          [
            ["Nợ bình thường", aging.normal, ""],
            [
              "Nợ khó trả",
              aging.hardToPay,
              aging.hardToPay > 0 ? "text-amber-600" : "",
            ],
            [
              "Nợ lâu năm",
              aging.critical,
              aging.critical > 0 ? "text-destructive" : "",
            ],
          ] as [string, number, string][]
        ).map(([label, val, cls]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className={`font-mono font-medium ${cls}`}>
              {fmtVND(val)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Invoice detail table ─────────────────────────────────────────────────────

function InvoiceDetailTable({
  invoices,
}: Readonly<{ invoices: ApDebtInvoiceRow[] }>) {
  if (invoices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Không có hóa đơn
      </p>
    );
  }
  const totalGrand = invoices.reduce(
    (s, i) => s + (Number.parseFloat(i.grandTotal) || 0),
    0,
  );
  return (
    <div className="overflow-auto rounded-lg border">
      <table
        className="text-sm border-collapse"
        style={{ minWidth: "max-content" }}
      >
        <thead>
          <tr className="bg-muted/60 border-b sticky top-0">
            <th className="px-3 py-2 text-center font-medium text-xs border-r w-8">
              #
            </th>
            <th className="px-3 py-2 text-left font-medium text-xs border-r whitespace-nowrap">
              Ngày hạch toán
            </th>
            <th className="px-3 py-2 text-left font-medium text-xs border-r whitespace-nowrap">
              Ngày chứng từ
            </th>
            <th className="px-3 py-2 text-left font-medium text-xs border-r whitespace-nowrap">
              Số chứng từ
            </th>
            <th className="px-3 py-2 text-left font-medium text-xs border-r whitespace-nowrap">
              Số HĐ NCC
            </th>
            <th className="px-3 py-2 text-left font-medium text-xs border-r whitespace-nowrap">
              Hạn thanh toán
            </th>
            <th className="px-3 py-2 text-right font-medium text-xs border-r whitespace-nowrap">
              Phải trả theo HĐ
            </th>
            <th className="px-3 py-2 text-right font-medium text-xs border-r whitespace-nowrap">
              Số đã trả/Giảm trừ HĐ
            </th>
            <th className="px-3 py-2 text-right font-medium text-xs border-r whitespace-nowrap">
              Số còn phải trả theo HĐ
            </th>
            <th className="px-3 py-2 text-right font-medium text-xs border-r whitespace-nowrap">
              Giảm trừ khác
            </th>
            <th className="px-3 py-2 text-right font-medium text-xs border-r whitespace-nowrap">
              Số còn phải trả
            </th>
            <th className="px-3 py-2 text-left font-medium text-xs whitespace-nowrap">
              Tình trạng
            </th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv, i) => {
            const amount = Number.parseFloat(inv.grandTotal) || 0;
            const status = debtStatus(inv.overdueDays);
            const bg = i % 2 === 0 ? "" : "bg-muted/20";
            return (
              <tr key={inv.invoiceId} className={`border-b ${bg}`}>
                <td className="px-3 py-1.5 text-center text-xs border-r text-muted-foreground">
                  {i + 1}
                </td>
                <td className="px-3 py-1.5 text-xs border-r whitespace-nowrap">
                  {fmtDate(inv.voucherDate)}
                </td>
                <td className="px-3 py-1.5 text-xs border-r whitespace-nowrap">
                  {fmtDate(inv.voucherDate)}
                </td>
                <td className="px-3 py-1.5 text-xs border-r whitespace-nowrap font-medium text-primary">
                  {inv.voucherNumber}
                </td>
                <td className="px-3 py-1.5 text-xs border-r whitespace-nowrap">
                  {inv.invoiceNumber ?? "—"}
                </td>
                <td className="px-3 py-1.5 text-xs border-r whitespace-nowrap">
                  {fmtDate(inv.dueDate)}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-xs border-r">
                  {fmtVND(amount)}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-xs border-r text-muted-foreground">
                  0
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-xs border-r">
                  {fmtVND(amount)}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-xs border-r text-muted-foreground">
                  0
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-xs border-r font-semibold">
                  {fmtVND(amount)}
                </td>
                <td
                  className={`px-3 py-1.5 text-xs whitespace-nowrap ${status.cls}`}
                >
                  {status.label}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-muted font-bold border-t-2">
            <td colSpan={6} className="px-3 py-1.5 text-xs border-r">
              Tổng
            </td>
            <td className="px-3 py-1.5 text-right font-mono text-xs border-r">
              {fmtVND(totalGrand)}
            </td>
            <td className="px-3 py-1.5 text-right font-mono text-xs border-r"></td>
            <td className="px-3 py-1.5 text-right font-mono text-xs border-r">
              {fmtVND(totalGrand)}
            </td>
            <td className="px-3 py-1.5 text-right font-mono text-xs border-r"></td>
            <td className="px-3 py-1.5 text-right font-mono text-xs border-r">
              {fmtVND(totalGrand)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── Bottom detail panel ──────────────────────────────────────────────────────

function DetailPanel({
  row,
  token,
  onClose,
}: Readonly<{
  row: SupplierDebtRow;
  token: string;
  onClose: () => void;
}>) {
  const { data, isLoading } = useQuery({
    queryKey: ["ap-debt-detail", row.supplierId, token],
    queryFn: () => api.apDebt.detail(row.supplierId, token).then((r) => r.data),
    enabled: !!token,
    staleTime: 30_000,
  });

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-6 py-2 border-b bg-muted/30 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-semibold text-sm text-primary shrink-0">
            {row.supplierCode}
          </span>
          <span className="text-muted-foreground text-xs shrink-0">—</span>
          <span className="text-sm font-medium truncate">
            {row.supplierName}
          </span>
          {row.hasOverdue && (
            <Badge variant="destructive" className="text-xs shrink-0">
              Có nợ quá hạn
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X size={14} />
          </Button>
        </div>
      </div>

      {(() => {
        if (isLoading) {
          return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm gap-2">
              <Loader2 className="animate-spin" size={16} /> Đang tải...
            </div>
          );
        }
        if (!data) return null;
        return (
          <Tabs defaultValue="aging" className="flex flex-col flex-1 min-h-0">
            <div className="px-6 pt-2 flex-shrink-0 border-b">
              <TabsList className="h-8">
                <TabsTrigger value="aging" className="text-xs h-7">
                  Phân tích nợ theo hóa đơn
                </TabsTrigger>
                <TabsTrigger value="detail" className="text-xs h-7">
                  Chi tiết
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="aging" className="flex-1 overflow-auto m-0 p-4">
              <AgingPanel aging={data.aging} />
            </TabsContent>
            <TabsContent
              value="detail"
              className="flex-1 overflow-auto m-0 p-4"
            >
              <InvoiceDetailTable invoices={data.invoices} />
            </TabsContent>
          </Tabs>
        );
      })()}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function APDebtsPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<SupplierDebtRow | null>(null);
  const [paymentDialogRow, setPaymentDialogRow] =
    useState<SupplierDebtRow | null>(null);

  const limit = 20;

  const filters = useMemo(
    () => ({
      q: q || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      overdueOnly,
      page,
      limit,
    }),
    [q, dateFrom, dateTo, overdueOnly, page],
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ap-debts", filters, token],
    queryFn: () => api.apDebt.list(token, filters).then((r) => r.data),
    enabled: !!token,
    staleTime: 30_000,
  });

  const rows: SupplierDebtRow[] = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const sumByInvoice = rows.reduce(
    (s, r) => s + (Number.parseFloat(r.totalByInvoice) || 0),
    0,
  );
  const sumPaid = rows.reduce(
    (s, r) => s + (Number.parseFloat(r.totalPaid) || 0),
    0,
  );
  const sumRemaining = rows.reduce(
    (s, r) => s + (Number.parseFloat(r.remaining) || 0),
    0,
  );

  const selectedInView =
    rows.find((r) => r.supplierId === selectedRow?.supplierId) ?? null;
  const panelOpen = selectedInView !== null;

  function resetFilter() {
    setQ("");
    setDateFrom("");
    setDateTo("");
    setOverdueOnly(false);
    setPage(1);
  }

  const hasFilter = q || dateFrom || dateTo || overdueOnly;

  return (
    <>
      <ResizablePanelGroup
        key={panelOpen ? "split" : "full"}
        direction="vertical"
        className="flex-1 min-h-0"
      >
        {/* ── Top panel: toolbar + table ── */}
        <ResizablePanel defaultSize={panelOpen ? 55 : 100} minSize={30}>
          <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 items-end px-6 pt-4 pb-3 border-b flex-shrink-0">
              <Filter
                size={14}
                className="text-muted-foreground self-center shrink-0"
              />
              <div className="flex items-center gap-1">
                <Label className="text-xs whitespace-nowrap">Từ ngày</Label>
                <Input
                  type="date"
                  className="h-8 text-xs w-36"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex items-center gap-1">
                <Label className="text-xs whitespace-nowrap">Đến ngày</Label>
                <Input
                  type="date"
                  className="h-8 text-xs w-36"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Button
                variant={overdueOnly ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => {
                  setOverdueOnly(!overdueOnly);
                  setPage(1);
                }}
              >
                <AlertTriangle size={13} /> Chỉ quá hạn
              </Button>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  className="pl-8 h-8 text-xs w-52"
                  placeholder="Tìm nhà cung cấp, MST..."
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              {hasFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={resetFilter}
                >
                  Xóa điều kiện lọc
                </Button>
              )}
              <div className="ml-auto flex items-center gap-2">
                {total > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Tổng số: <strong>{total}</strong> bản ghi
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => refetch()}
                >
                  <RefreshCw size={13} /> Làm mới
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted/80 border-b">
                    <th className="px-3 py-2 text-left font-medium text-xs whitespace-nowrap">
                      Mã NCC
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-xs">
                      Tên nhà cung cấp
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-xs whitespace-nowrap">
                      Số còn phải trả theo HĐ
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-xs whitespace-nowrap">
                      Số đã trả/Giảm trừ khác
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-xs whitespace-nowrap">
                      Số còn phải trả
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-xs">
                      Địa chỉ
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-xs whitespace-nowrap">
                      Mã số thuế
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-xs whitespace-nowrap">
                      Chức năng
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (isLoading) {
                      return (
                        <tr>
                          <td
                            colSpan={8}
                            className="text-center py-16 text-muted-foreground"
                          >
                            <Loader2
                              className="animate-spin mx-auto mb-2"
                              size={20}
                            />
                            Đang tải...
                          </td>
                        </tr>
                      );
                    }
                    if (rows.length === 0) {
                      return (
                        <tr>
                          <td
                            colSpan={8}
                            className="text-center py-16 text-muted-foreground text-sm"
                          >
                            Không có dữ liệu công nợ phải trả
                          </td>
                        </tr>
                      );
                    }
                    return rows.map((row, i) => {
                      const isSelected =
                        selectedInView?.supplierId === row.supplierId;
                      let rowBg: string;
                      if (isSelected) {
                        rowBg = "bg-primary/10 hover:bg-primary/15";
                      } else if (row.hasOverdue) {
                        rowBg = "bg-destructive/5 hover:bg-destructive/10";
                      } else if (i % 2 === 0) {
                        rowBg = "hover:bg-muted/40";
                      } else {
                        rowBg = "bg-muted/20 hover:bg-muted/40";
                      }
                      return (
                        <tr
                          key={row.supplierId}
                          className={`border-b cursor-pointer transition-colors ${rowBg}`}
                          onClick={() =>
                            setSelectedRow(isSelected ? null : row)
                          }
                        >
                          <td className="px-3 py-2 font-medium text-primary text-xs whitespace-nowrap">
                            {row.supplierCode}
                            {row.hasOverdue && (
                              <AlertTriangle
                                size={11}
                                className="inline ml-1 text-destructive"
                              />
                            )}
                          </td>
                          <td
                            className="px-3 py-2 max-w-[200px] truncate text-sm"
                            title={row.supplierName}
                          >
                            {row.supplierName}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs">
                            {fmtVND(row.totalByInvoice)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs">
                            {fmtVND(row.totalPaid)}
                          </td>
                          <td
                            className={`px-3 py-2 text-right font-mono text-xs font-semibold ${row.hasOverdue ? "text-destructive" : ""}`}
                          >
                            {fmtVND(row.remaining)}
                          </td>
                          <td
                            className="px-3 py-2 text-xs text-muted-foreground max-w-[160px] truncate"
                            title={row.address ?? ""}
                          >
                            {row.address ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {row.taxCode ?? "—"}
                          </td>
                          <td
                            className="px-3 py-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex gap-1 justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs gap-1 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPaymentDialogRow(row);
                                }}
                              >
                                Chi tiền
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
                {rows.length > 0 && (
                  <tfoot className="sticky bottom-0">
                    <tr className="bg-muted font-bold border-t-2">
                      <td colSpan={2} className="px-3 py-2 text-xs">
                        Tổng cộng
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {fmtVND(sumByInvoice)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {fmtVND(sumPaid)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs font-semibold">
                        {fmtVND(sumRemaining)}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-2 border-t text-xs text-muted-foreground flex-shrink-0 bg-background">
                <span>
                  Trang {page} / {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs px-2"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Trước
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, idx) => {
                    const p = idx + 1;
                    return (
                      <Button
                        key={p}
                        variant={page === p ? "default" : "outline"}
                        size="sm"
                        className="h-6 w-6 text-xs p-0"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && <span className="px-1">…</span>}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs px-2"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>

        {/* ── Bottom panel: only when selected ── */}
        {selectedInView && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={45} minSize={20}>
              <DetailPanel
                row={selectedInView}
                token={token}
                onClose={() => setSelectedRow(null)}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
      {paymentDialogRow && (
        <APPaymentDialog
          supplierId={paymentDialogRow.supplierId}
          supplierCode={paymentDialogRow.supplierCode}
          supplierName={paymentDialogRow.supplierName}
          totalRemaining={Number.parseFloat(paymentDialogRow.remaining) || 0}
          token={token}
          onClose={() => setPaymentDialogRow(null)}
          onSuccess={() => refetch()}
        />
      )}
    </>
  );
}

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Filter,
  Search,
  RefreshCw,
  FileDown,
  SendHorizontal,
  ChevronDown,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Printer,
  Mail,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  api,
  type SalesInvoiceListItem,
  type SalesInvoiceFull,
  type InvoiceStatus,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtVND(value: string | number) {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isNaN(n) ? "0" : new Intl.NumberFormat("vi-VN").format(n);
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// suppress unused-type warning
type _Used = SalesInvoiceListItem;

// ─── Badges ───────────────────────────────────────────────────────────────────

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const map: Record<InvoiceStatus, { label: string; className: string }> = {
    DRAFT: {
      label: "Hóa đơn mới",
      className: "bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs",
    },
    ISSUED: {
      label: "Đã phát hành",
      className: "bg-success/10 text-success border-success/30 text-xs",
    },
    CANCELLED: {
      label: "Đã hủy",
      className:
        "bg-destructive/10 text-destructive border-destructive/30 text-xs",
    },
  };
  const cfg = map[status];
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}

function VoucherStatusBadge({ isPosted }: { isPosted: boolean }) {
  if (isPosted)
    return (
      <Badge
        variant="outline"
        className="bg-success/10 text-success border-success/30 text-xs"
      >
        Đã lập đủ
      </Badge>
    );
  return (
    <Badge
      variant="outline"
      className="bg-muted text-muted-foreground border text-xs"
    >
      Chưa ghi sổ
    </Badge>
  );
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({
  field,
  sortBy,
  sortDir,
}: {
  field: string;
  sortBy: string;
  sortDir: "asc" | "desc";
}) {
  if (sortBy !== field)
    return <ArrowUpDown size={12} className="ml-1 opacity-40" />;
  return sortDir === "asc" ? (
    <ArrowUp size={12} className="ml-1 text-primary" />
  ) : (
    <ArrowDown size={12} className="ml-1 text-primary" />
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function InvoiceLineTab({ invoice }: { invoice: SalesInvoiceFull }) {
  const totalQty = invoice.details.reduce(
    (s, d) => s + Number.parseFloat(d.qty),
    0,
  );
  const totalAmt = invoice.details.reduce(
    (s, d) => s + Number.parseFloat(d.amount),
    0,
  );
  const totalVat = invoice.details.reduce((s, d) => {
    const amt = Number.parseFloat(d.amount);
    const rate = Number.parseFloat(d.vatRate) / 100;
    return s + amt * rate;
  }, 0);

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-xs border-collapse table-fixed">
        {/* # | Mã hàng | Tên hàng | CK TM | DVT | SL | ĐG sau thuế | ĐG | Thành tiền | %VAT | Tiền VAT */}
        <colgroup>
          <col className="w-8" />
          <col className="w-24" />
          <col />
          <col className="w-10" />
          <col className="w-12" />
          <col className="w-14" />
          <col className="w-28" />
          <col className="w-28" />
          <col className="w-28" />
          <col className="w-14" />
          <col className="w-28" />
        </colgroup>
        <thead className="sticky top-0 bg-muted/70 backdrop-blur-sm z-10">
          <tr className="border-b border-border">
            <th className="px-2 py-1.5 text-center font-medium text-muted-foreground">
              #
            </th>
            <th className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">
              Mã hàng
            </th>
            <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
              Tên hàng
            </th>
            <th className="px-2 py-1.5 text-center font-medium text-muted-foreground whitespace-nowrap">
              CK TM
            </th>
            <th className="px-2 py-1.5 text-center font-medium text-muted-foreground whitespace-nowrap">
              DVT
            </th>
            <th className="px-2 py-1.5 text-right font-medium text-muted-foreground whitespace-nowrap">
              Số lượng
            </th>
            <th className="px-2 py-1.5 text-right font-medium text-muted-foreground whitespace-nowrap">
              Đơn giá sau thuế
            </th>
            <th className="px-2 py-1.5 text-right font-medium text-muted-foreground whitespace-nowrap">
              Đơn giá
            </th>
            <th className="px-2 py-1.5 text-right font-medium text-muted-foreground whitespace-nowrap">
              Thành tiền
            </th>
            <th className="px-2 py-1.5 text-center font-medium text-muted-foreground whitespace-nowrap">
              % GTGT
            </th>
            <th className="px-2 py-1.5 text-right font-medium text-muted-foreground whitespace-nowrap">
              Tiền thuế GTGT
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.details.map((d, i) => {
            const qty = Number.parseFloat(d.qty);
            const unitPrice = Number.parseFloat(d.unitPrice);
            const vatRate = Number.parseFloat(d.vatRate);
            const unitWithTax = unitPrice * (1 + vatRate / 100);
            const lineAmt = Number.parseFloat(d.amount);
            const lineVat = lineAmt * (vatRate / 100);
            return (
              <tr
                key={d.id}
                className="border-b border-border/40 hover:bg-muted/30"
              >
                <td className="px-2 py-1.5 text-center text-muted-foreground">
                  {i + 1}
                </td>
                <td className="px-2 py-1.5 font-medium text-primary truncate">
                  {d.item.sku}
                </td>
                <td className="px-2 py-1.5 truncate">{d.item.name}</td>
                <td className="px-2 py-1.5 text-center text-muted-foreground">
                  —
                </td>
                <td className="px-2 py-1.5 text-center">{d.item.unit}</td>
                <td className="px-2 py-1.5 text-right font-mono">
                  {qty.toLocaleString("vi-VN")}
                </td>
                <td className="px-2 py-1.5 text-right font-mono">
                  {fmtVND(unitWithTax)}
                </td>
                <td className="px-2 py-1.5 text-right font-mono">
                  {fmtVND(unitPrice)}
                </td>
                <td className="px-2 py-1.5 text-right font-mono font-medium">
                  {fmtVND(lineAmt)}
                </td>
                <td className="px-2 py-1.5 text-center">{vatRate}%</td>
                <td className="px-2 py-1.5 text-right font-mono">
                  {fmtVND(lineVat)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="sticky bottom-0 bg-muted/80 backdrop-blur-sm">
          <tr className="border-t-2 border-border font-semibold">
            <td colSpan={5} className="px-2 py-1.5 text-xs">
              Tổng
            </td>
            <td className="px-2 py-1.5 text-right font-mono">
              {totalQty.toLocaleString("vi-VN")}
            </td>
            <td colSpan={2} />
            <td className="px-2 py-1.5 text-right font-mono">
              {fmtVND(totalAmt)}
            </td>
            <td />
            <td className="px-2 py-1.5 text-right font-mono">
              {fmtVND(totalVat)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportToCsv(rows: SalesInvoiceListItem[]) {
  const headers = [
    "Ngày HĐ",
    "Số HĐ",
    "Ký hiệu",
    "Loại",
    "Trạng thái HĐ",
    "Khách hàng",
    "Tiền hàng",
    "Tiền thuế",
    "Tổng TT",
    "TT chứng từ",
  ];
  const csvRows = rows.map((r) => [
    fmtDate(r.accountingDate),
    r.invoiceNumber ?? "—",
    r.invoiceSeries ?? "—",
    "Hóa đơn GTGT",
    r.invoiceStatus === "ISSUED"
      ? "Đã phát hành"
      : r.invoiceStatus === "CANCELLED"
        ? "Đã hủy"
        : "Hóa đơn mới",
    r.customer.name,
    r.totalAmount,
    r.vatAmount,
    r.grandTotal,
    r.isPosted ? "Đã lập đủ" : "Chưa ghi sổ",
  ]);
  const content = [headers, ...csvRows]
    .map((row) =>
      row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hoa-don-ban-ra-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Send Invoice Dialog ──────────────────────────────────────────────────────

function SendInvoiceDialog({
  invoiceId,
  token,
  onClose,
}: Readonly<{ invoiceId: string; token: string; onClose: () => void }>) {
  const [to, setTo] = useState("");
  const [ccRaw, setCcRaw] = useState(""); // comma-separated
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  // Load suggested email from customer config
  const defaultsQuery = useQuery({
    queryKey: ["invoice-send-defaults", invoiceId, token],
    queryFn: () =>
      api.salesInvoice.getSendDefaults(invoiceId, token).then((r) => r.data),
    enabled: !!token,
    staleTime: 0,
    gcTime: 0,
  });

  // Populate once loaded
  const [populated, setPopulated] = useState(false);
  if (defaultsQuery.data && !populated) {
    setPopulated(true);
    setTo(defaultsQuery.data.suggestedTo);
    setCcRaw(defaultsQuery.data.suggestedCc.join(", "));
  }

  async function handleSend() {
    const trimTo = to.trim();
    if (!trimTo) {
      toast.error("Vui lòng nhập địa chỉ email nhận");
      return;
    }
    const cc = ccRaw
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    setSending(true);
    try {
      await api.salesInvoice.sendEmail(
        invoiceId,
        { to: trimTo, cc, note: note.trim() || undefined },
        token,
      );
      toast.success(`Đã gửi hóa đơn đến ${trimTo}`, { duration: 5000 });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi gửi email");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o && !sending) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail size={16} />
            Gửi hóa đơn qua email
          </DialogTitle>
        </DialogHeader>

        {defaultsQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={24} />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Gửi đến <span className="text-destructive">*</span>
              </Label>
              <Input
                type="email"
                placeholder="email@company.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                disabled={sending}
              />
              <p className="text-xs text-muted-foreground">
                Email chính của khách hàng (lấy từ mục Email nhắc nợ trong danh
                mục đối tác)
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>
                CC{" "}
                <span className="text-xs text-muted-foreground">
                  (tùy chọn)
                </span>
              </Label>
              <Input
                type="text"
                placeholder="cc1@co.com, cc2@co.com"
                value={ccRaw}
                onChange={(e) => setCcRaw(e.target.value)}
                disabled={sending}
              />
              <p className="text-xs text-muted-foreground">
                Nhiều địa chỉ cách nhau bằng dấu phẩy
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>
                Ghi chú{" "}
                <span className="text-xs text-muted-foreground">
                  (tùy chọn)
                </span>
              </Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                placeholder="Kính gửi Quý khách, vui lòng xem hóa đơn đính kèm..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={sending}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={sending}
            onClick={onClose}
          >
            <X size={14} className="mr-1" />
            Hủy
          </Button>
          <Button
            size="sm"
            disabled={sending || defaultsQuery.isLoading}
            onClick={handleSend}
          >
            {sending ? (
              <>
                <Loader2 size={14} className="animate-spin mr-1" />
                Đang gửi…
              </>
            ) : (
              <>
                <Mail size={14} className="mr-1" />
                Gửi hóa đơn
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ARInvoicesPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [sendTarget, setSendTarget] = useState<string | null>(null);

  // Filter (pending vs applied)
  const [pendingStatus, setPendingStatus] = useState("all");
  const [pendingDateFrom, setPendingDateFrom] = useState("");
  const [pendingDateTo, setPendingDateTo] = useState("");
  const [pendingDatePreset, setPendingDatePreset] = useState("all");

  const [appliedStatus, setAppliedStatus] = useState<InvoiceStatus | undefined>(
    undefined,
  );
  const [appliedDateFrom, setAppliedDateFrom] = useState<string | undefined>(
    undefined,
  );
  const [appliedDateTo, setAppliedDateTo] = useState<string | undefined>(
    undefined,
  );

  // Sort
  const [sortBy, setSortBy] = useState<"accountingDate" | "grandTotal">(
    "accountingDate",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(field: "accountingDate" | "grandTotal") {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  }

  // Pagination & selection
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const PAGE_LIMIT = 50;

  // Query — chỉ lấy chứng từ có lập hóa đơn GTGT (isInvoiced: true), bao gồm cả DRAFT
  const {
    data: listData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      "ar-invoices",
      appliedStatus,
      appliedDateFrom,
      appliedDateTo,
      sortBy,
      sortDir,
      page,
      token,
    ],
    queryFn: () =>
      api.salesInvoice
        .list(token, {
          isInvoiced: true,
          invoiceStatus: appliedStatus,
          dateFrom: appliedDateFrom,
          dateTo: appliedDateTo,
          sortBy,
          sortDir,
          page,
          limit: PAGE_LIMIT,
        })
        .then((r) => r.data),
    enabled: !!token,
    staleTime: 30_000,
  });

  const rows = listData?.rows ?? [];

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.voucherNumber.toLowerCase().includes(q) ||
        (r.invoiceNumber ?? "").toLowerCase().includes(q) ||
        r.customer.name.toLowerCase().includes(q),
    );
  }, [rows, search]);

  // Detail query
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["sales-invoice", selectedId, token],
    queryFn: () =>
      api.salesInvoice.getById(selectedId!, token).then((r) => r.data),
    enabled: !!token && !!selectedId,
    staleTime: 60_000,
  });

  // Derived
  const allChecked =
    filteredRows.length > 0 && filteredRows.every((r) => selectedIds.has(r.id));
  const someChecked =
    !allChecked && filteredRows.some((r) => selectedIds.has(r.id));
  const totalAmt = filteredRows.reduce(
    (s, r) => s + Number.parseFloat(r.totalAmount),
    0,
  );
  const totalVat = filteredRows.reduce(
    (s, r) => s + Number.parseFloat(r.vatAmount),
    0,
  );
  const totalPages = Math.ceil((listData?.total ?? 0) / PAGE_LIMIT);
  const selectedItem = filteredRows.find((r) => r.id === selectedId) ?? null;

  function toggleAll(c: boolean) {
    setSelectedIds(c ? new Set(filteredRows.map((r) => r.id)) : new Set());
  }
  function toggleRow(id: string, c: boolean) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      c ? n.add(id) : n.delete(id);
      return n;
    });
  }

  // Filter helpers
  function applyDatePreset(preset: string) {
    setPendingDatePreset(preset);
    const now = new Date();
    const today = toIsoDate(now);
    if (preset === "today") {
      setPendingDateFrom(today);
      setPendingDateTo(today);
    } else if (preset === "7d") {
      const f = new Date();
      f.setDate(f.getDate() - 7);
      setPendingDateFrom(toIsoDate(f));
      setPendingDateTo(today);
    } else if (preset === "month") {
      setPendingDateFrom(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
      );
      setPendingDateTo(today);
    } else if (preset === "quarter") {
      const s = new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3,
        1,
      );
      setPendingDateFrom(toIsoDate(s));
      setPendingDateTo(today);
    } else if (preset === "ytd") {
      setPendingDateFrom(`${now.getFullYear()}-01-01`);
      setPendingDateTo(today);
    } else {
      setPendingDateFrom("");
      setPendingDateTo("");
    }
  }

  function handleApplyFilter() {
    setAppliedStatus(
      pendingStatus !== "all" ? (pendingStatus as InvoiceStatus) : undefined,
    );
    setAppliedDateFrom(pendingDateFrom || undefined);
    setAppliedDateTo(pendingDateTo || undefined);
    setPage(1);
    setShowFilter(false);
  }

  function handleResetFilter() {
    setPendingStatus("all");
    applyDatePreset("all");
    setAppliedStatus(undefined);
    setAppliedDateFrom(undefined);
    setAppliedDateTo(undefined);
  }

  const activeFilterCount = [
    appliedStatus !== undefined,
    appliedDateFrom !== undefined,
  ].filter(Boolean).length;

  // Actions
  async function handleIssueInvoice(id: string) {
    setIssuingId(id);
    try {
      const result = await api.salesInvoice.issueInvoice(id, token);
      toast.success(
        `Phát hành hóa đơn thành công — Số HĐ: ${result.data.invoiceNumber ?? "—"}`,
        { duration: 5000 },
      );
      void queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
      void queryClient.invalidateQueries({ queryKey: ["sales-invoice", id] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Lỗi khi phát hành hóa đơn",
      );
    } finally {
      setIssuingId(null);
    }
  }

  async function handleDeleteInvoice(id: string) {
    try {
      await api.salesInvoice.delete(id, token);
      toast.success("Đã xóa chứng từ");
      if (selectedId === id) setSelectedId(null);
      void queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi xóa chứng từ");
    } finally {
      setDeleteTarget(null);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <ResizablePanelGroup direction="vertical">
        {/* ── Top: invoice list ────────────────────────────────────────── */}
        <ResizablePanel
          defaultSize={58}
          minSize={28}
          className="flex flex-col overflow-hidden"
        >
          {/* Toolbar */}
          <div className="px-3 py-2 border-b border-border bg-card flex items-center justify-between gap-2 shrink-0 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant={showFilter ? "secondary" : "outline"}
                size="sm"
                className="gap-1.5 text-xs h-8 relative"
                onClick={() => setShowFilter((v) => !v)}
              >
                <Filter size={14} />
                Lọc
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Số HĐ, số CT, khách hàng..."
                  className="pl-8 h-8 w-64 text-xs"
                />
              </div>
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
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Xuất Excel"
                disabled={filteredRows.length === 0}
                onClick={() => exportToCsv(filteredRows)}
              >
                <FileDown size={15} />
              </Button>
            </div>
          </div>

          {/* Filter panel */}
          {showFilter && (
            <div className="px-4 py-3 border-b border-border bg-muted/30 shrink-0">
              <div className="flex items-end gap-3 flex-wrap">
                <div className="space-y-1">
                  <Label className="text-xs">Trạng thái hóa đơn</Label>
                  <Select
                    value={pendingStatus}
                    onValueChange={setPendingStatus}
                  >
                    <SelectTrigger className="h-8 text-xs w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="DRAFT">Hóa đơn mới</SelectItem>
                      <SelectItem value="ISSUED">Đã phát hành</SelectItem>
                      <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Thời gian</Label>
                  <Select
                    value={pendingDatePreset}
                    onValueChange={applyDatePreset}
                  >
                    <SelectTrigger className="h-8 text-xs w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả thời gian</SelectItem>
                      <SelectItem value="today">Hôm nay</SelectItem>
                      <SelectItem value="7d">7 ngày qua</SelectItem>
                      <SelectItem value="month">Tháng này</SelectItem>
                      <SelectItem value="quarter">Quý này</SelectItem>
                      <SelectItem value="ytd">Đầu năm đến hiện tại</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Từ ngày</Label>
                  <Input
                    type="date"
                    className="h-8 text-xs w-36"
                    value={pendingDateFrom}
                    onChange={(e) => {
                      setPendingDateFrom(e.target.value);
                      setPendingDatePreset("");
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Đến ngày</Label>
                  <Input
                    type="date"
                    className="h-8 text-xs w-36"
                    value={pendingDateTo}
                    onChange={(e) => {
                      setPendingDateTo(e.target.value);
                      setPendingDatePreset("");
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={handleResetFilter}
                  >
                    Đặt lại
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    onClick={handleApplyFilter}
                  >
                    Lọc
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-destructive">
              <AlertCircle size={24} />
              <p className="text-sm">Không thể tải danh sách.</p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Thử lại
              </Button>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                  <tr className="border-b border-border">
                    <th className="w-10 px-3 py-2 text-left">
                      <Checkbox
                        checked={someChecked ? "indeterminate" : allChecked}
                        onCheckedChange={(c) => toggleAll(!!c)}
                      />
                    </th>
                    <th
                      className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap w-28 cursor-pointer hover:text-foreground select-none"
                      onClick={() => toggleSort("accountingDate")}
                    >
                      <span className="inline-flex items-center">
                        Ngày hóa đơn
                        <SortIcon
                          field="accountingDate"
                          sortBy={sortBy}
                          sortDir={sortDir}
                        />
                      </span>
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap w-40">
                      Số hóa đơn
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap w-24">
                      Loại
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap w-32">
                      Trạng thái HĐ
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">
                      Khách hàng
                    </th>
                    <th
                      className="px-3 py-2 text-right font-medium text-muted-foreground text-xs whitespace-nowrap w-36 cursor-pointer hover:text-foreground select-none"
                      onClick={() => toggleSort("grandTotal")}
                    >
                      <span className="inline-flex items-center justify-end w-full">
                        Giá trị HĐ
                        <SortIcon
                          field="grandTotal"
                          sortBy={sortBy}
                          sortDir={sortDir}
                        />
                      </span>
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap w-28">
                      TT lập CT
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground text-xs whitespace-nowrap w-36">
                      Chức năng
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-3 py-12 text-center text-muted-foreground text-sm"
                      >
                        Không có chứng từ nào có lập hóa đơn trong kỳ này.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((inv) => (
                      <tr
                        key={inv.id}
                        onClick={() => setSelectedId(inv.id)}
                        className={`border-b border-border/50 cursor-pointer transition-colors hover:bg-muted/40 ${selectedId === inv.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                      >
                        <td
                          className="px-3 py-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={selectedIds.has(inv.id)}
                            onCheckedChange={(c) => toggleRow(inv.id, !!c)}
                          />
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {fmtDate(inv.accountingDate)}
                        </td>
                        <td className="px-3 py-2">
                          {inv.invoiceNumber ? (
                            <span className="text-primary font-medium text-xs">
                              {inv.invoiceNumber}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Chưa có
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                          HĐ GTGT
                        </td>
                        <td className="px-3 py-2">
                          <InvoiceStatusBadge status={inv.invoiceStatus} />
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {inv.customer.name}
                        </td>
                        <td className="px-3 py-2 text-right text-xs font-mono font-medium">
                          {fmtVND(inv.grandTotal)}
                        </td>
                        <td className="px-3 py-2">
                          <VoucherStatusBadge isPosted={inv.isPosted} />
                        </td>
                        <td
                          className="px-3 py-2 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {inv.invoiceStatus === "ISSUED" ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs gap-1 text-primary hover:text-primary"
                                >
                                  Xem <ChevronDown size={12} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(`/sales/invoices/${inv.id}`)
                                  }
                                >
                                  Xem chứng từ
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setSendTarget(inv.id)}
                                >
                                  <Mail size={12} className="mr-1.5" />
                                  Gửi hóa đơn
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(`/ar/invoices/${inv.id}/print`)
                                  }
                                >
                                  <Printer size={12} className="mr-1.5" />
                                  Tải hóa đơn
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  disabled={issuingId === inv.id}
                                >
                                  {issuingId === inv.id ? (
                                    <>
                                      <Loader2
                                        size={12}
                                        className="animate-spin"
                                      />
                                      Đang phát hành…
                                    </>
                                  ) : (
                                    <>
                                      <SendHorizontal size={12} />
                                      Phát hành <ChevronDown size={12} />
                                    </>
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  disabled={issuingId === inv.id}
                                  onClick={() => handleIssueInvoice(inv.id)}
                                >
                                  <SendHorizontal
                                    size={12}
                                    className="mr-1.5"
                                  />
                                  Phát hành HĐ
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(`/sales/invoices/${inv.id}`)
                                  }
                                >
                                  Xem chứng từ
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteTarget(inv.id)}
                                >
                                  <Trash2 size={12} className="mr-1.5" />
                                  Xóa
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredRows.length > 0 && (
                  <tfoot className="sticky bottom-0 bg-muted/90 backdrop-blur-sm">
                    <tr className="border-t-2 border-border font-semibold text-xs">
                      <td className="px-3 py-2" colSpan={2}>
                        Tổng: {filteredRows.length} hóa đơn
                      </td>
                      <td colSpan={3} />
                      <td className="px-3 py-2 text-right font-mono">
                        {fmtVND(totalAmt + totalVat)}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* Pagination bar */}
          <div className="px-4 py-1.5 border-t border-border bg-card flex items-center justify-between shrink-0">
            <span className="text-xs text-muted-foreground">
              {selectedIds.size > 0
                ? `Đã chọn ${selectedIds.size} / ${filteredRows.length}`
                : `${search.trim() ? filteredRows.length : (listData?.total ?? 0)} bản ghi`}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                Trang {page}/{totalPages || 1} — {(page - 1) * PAGE_LIMIT + 1}–
                {Math.min(page * PAGE_LIMIT, listData?.total ?? 0)} /{" "}
                {listData?.total ?? 0}
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
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* ── Bottom: line detail ──────────────────────────────────────── */}
        <ResizablePanel
          defaultSize={42}
          minSize={20}
          className="flex flex-col overflow-hidden bg-card"
        >
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Chọn một hóa đơn để xem chi tiết
            </div>
          ) : (
            <>
              <div className="px-4 py-2 border-b border-border flex items-center gap-3 shrink-0 flex-wrap text-xs bg-card">
                {selectedItem ? (
                  <>
                    <span className="font-semibold text-primary text-sm">
                      {selectedItem.invoiceNumber ?? selectedItem.voucherNumber}
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span>{selectedItem.customer.name}</span>
                    {selectedItem.customer.taxCode && (
                      <>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-muted-foreground">
                          MST: {selectedItem.customer.taxCode}
                        </span>
                      </>
                    )}
                    <span className="text-muted-foreground">|</span>
                    <span className="text-muted-foreground">
                      {fmtDate(selectedItem.accountingDate)}
                    </span>
                    <span className="ml-auto flex items-center gap-3">
                      <span>
                        <span className="text-muted-foreground mr-1">
                          Tiền hàng:
                        </span>
                        <span className="font-mono font-medium">
                          {fmtVND(selectedItem.totalAmount)}
                        </span>
                      </span>
                      <span>
                        <span className="text-muted-foreground mr-1">
                          Thuế:
                        </span>
                        <span className="font-mono font-medium">
                          {fmtVND(selectedItem.vatAmount)}
                        </span>
                      </span>
                      <span>
                        <span className="text-muted-foreground mr-1">
                          Tổng TT:
                        </span>
                        <span className="font-mono font-semibold text-primary">
                          {fmtVND(selectedItem.grandTotal)}
                        </span>
                      </span>
                      <InvoiceStatusBadge status={selectedItem.invoiceStatus} />
                      <VoucherStatusBadge isPosted={selectedItem.isPosted} />
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Đang tải...</span>
                )}
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                {detailLoading || !detailData ? (
                  <DetailSkeleton />
                ) : (
                  <InvoiceLineTab invoice={detailData} />
                )}
              </div>
            </>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Send invoice dialog */}
      {sendTarget && (
        <SendInvoiceDialog
          invoiceId={sendTarget}
          token={token}
          onClose={() => setSendTarget(null)}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa chứng từ</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa chứng từ này không? Thao tác này không
              thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDeleteInvoice(deleteTarget)}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

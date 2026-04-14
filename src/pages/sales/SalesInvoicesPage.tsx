import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Filter,
  Search,
  Settings2,
  RefreshCw,
  FileDown,
  Plus,
  ChevronDown,
  SendHorizontal,
  Layers,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

// --- Helpers ---

function fmtVND(value: string | number) {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isNaN(n) ? "0" : new Intl.NumberFormat("vi-VN").format(n);
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// --- Status badges ---

function VoucherStatusBadge({ isPosted }: { isPosted: boolean }) {
  if (isPosted) {
    return (
      <Badge
        variant="outline"
        className="bg-success/10 text-success border-success/30 text-xs"
      >
        Đã ghi sổ
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-muted text-muted-foreground border text-xs"
    >
      Nháp
    </Badge>
  );
}

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const map: Record<InvoiceStatus, { label: string; className: string }> = {
    DRAFT: {
      label: "Chưa phát hành",
      className: "bg-muted text-muted-foreground border text-xs",
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

// --- Detail panel – Hàng tiền tab ---

function HangTienTab({ invoice }: { invoice: SalesInvoiceFull }) {
  const totalQty = invoice.details.reduce(
    (s, d) => s + Number.parseFloat(d.qty),
    0,
  );
  const totalAmt = invoice.details.reduce(
    (s, d) => s + Number.parseFloat(d.amount),
    0,
  );

  return (
    <table className="w-full text-xs border-collapse table-fixed">
      {/* STT | Mã hàng | Tên hàng | Kho | TK CN | TK DT | ĐVT | SL | Đơn giá | Đơn giá sau thuế | % VAT | Thành tiền */}
      <colgroup>
        <col className="w-8" />
        <col className="w-24" />
        <col />
        <col className="w-20" />
        <col className="w-12" />
        <col className="w-12" />
        <col className="w-12" />
        <col className="w-14" />
        <col className="w-24" />
        <col className="w-28" />
        <col className="w-14" />
        <col className="w-24" />
      </colgroup>
      <thead className="sticky top-0 bg-muted/70 backdrop-blur-sm z-10">
        <tr className="border-b border-border">
          <th className="px-2 py-1.5 text-center font-medium text-muted-foreground whitespace-nowrap">
            STT
          </th>
          <th className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">
            Mã hàng
          </th>
          <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
            Tên hàng
          </th>
          <th className="px-2 py-1.5 text-center font-medium text-muted-foreground whitespace-nowrap">
            Kho
          </th>
          <th className="px-2 py-1.5 text-center font-medium text-muted-foreground whitespace-nowrap">
            TK CN
          </th>
          <th className="px-2 py-1.5 text-center font-medium text-muted-foreground whitespace-nowrap">
            TK DT
          </th>
          <th className="px-2 py-1.5 text-center font-medium text-muted-foreground whitespace-nowrap">
            ĐVT
          </th>
          <th className="px-2 py-1.5 text-right font-medium text-muted-foreground whitespace-nowrap">
            SL
          </th>
          <th className="px-2 py-1.5 text-right font-medium text-muted-foreground whitespace-nowrap">
            Đơn giá
          </th>
          <th className="px-2 py-1.5 text-right font-medium text-muted-foreground whitespace-nowrap">
            Đơn giá sau thuế
          </th>
          <th className="px-2 py-1.5 text-center font-medium text-muted-foreground whitespace-nowrap">
            % VAT
          </th>
          <th className="px-2 py-1.5 text-right font-medium text-muted-foreground whitespace-nowrap">
            Thành tiền
          </th>
        </tr>
      </thead>
      <tbody>
        {invoice.details.map((d, i) => {
          const qty = Number.parseFloat(d.qty);
          const unitPrice = Number.parseFloat(d.unitPrice);
          const vatRate = Number.parseFloat(d.vatRate);
          const unitPriceWithTax = unitPrice * (1 + vatRate / 100);
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
              <td className="px-2 py-1.5 text-center text-muted-foreground truncate">
                {d.warehouse?.name ?? "—"}
              </td>
              <td className="px-2 py-1.5 text-center text-muted-foreground">
                {d.arAccount?.code ?? "131"}
              </td>
              <td className="px-2 py-1.5 text-center text-muted-foreground">
                {d.revAccount?.code ?? "511"}
              </td>
              <td className="px-2 py-1.5 text-center">{d.item.unit}</td>
              <td className="px-2 py-1.5 text-right font-mono">
                {qty.toLocaleString("vi-VN")}
              </td>
              <td className="px-2 py-1.5 text-right font-mono">
                {fmtVND(d.unitPrice)}
              </td>
              <td className="px-2 py-1.5 text-right font-mono">
                {fmtVND(unitPriceWithTax)}
              </td>
              <td className="px-2 py-1.5 text-center">{vatRate}%</td>
              <td className="px-2 py-1.5 text-right font-mono font-medium">
                {fmtVND(d.amount)}
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot className="sticky bottom-0 bg-muted/80 backdrop-blur-sm">
        <tr className="border-t-2 border-border font-semibold">
          <td colSpan={7} className="px-2 py-1.5 text-xs">
            Tổng cộng
          </td>
          <td className="px-2 py-1.5 text-right font-mono">
            {totalQty.toLocaleString("vi-VN")}
          </td>
          <td colSpan={3} />
          <td className="px-2 py-1.5 text-right font-mono">
            {fmtVND(totalAmt)}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

// --- Detail panel – Thống kê tab ---

function ThongKeTab({ invoice }: { invoice: SalesInvoiceFull }) {
  const rows = [
    {
      label: "Tiền hàng (chưa VAT)",
      value: `${fmtVND(invoice.totalAmount)} VND`,
    },
    { label: "Thuế GTGT", value: `${fmtVND(invoice.vatAmount)} VND` },
    {
      label: "Tổng thanh toán",
      value: `${fmtVND(invoice.grandTotal)} VND`,
      bold: true,
    },
    null,
    {
      label: "Khách hàng",
      value: `${invoice.customer.code} — ${invoice.customer.name}`,
    },
    { label: "Mã số thuế / CCCD", value: invoice.customer.taxCode ?? "—" },
    { label: "Địa chỉ", value: invoice.customer.address ?? "—" },
    { label: "Người liên hệ", value: invoice.contactPerson ?? "—" },
    { label: "Nhân viên bán hàng", value: invoice.salesPersonName ?? "—" },
    { label: "Tham chiếu", value: invoice.reference ?? "—" },
    null,
    { label: "Ngày hạch toán", value: fmtDate(invoice.accountingDate) },
    { label: "Ngày chứng từ", value: fmtDate(invoice.voucherDate) },
    {
      label: "Số ngày được nợ",
      value:
        invoice.paymentTermDays != null
          ? `${invoice.paymentTermDays} ngày`
          : "—",
    },
    {
      label: "Hạn thanh toán",
      value: invoice.dueDate ? fmtDate(invoice.dueDate) : "—",
    },
    null,
    { label: "Ký hiệu HĐ", value: invoice.invoiceSeries ?? "—" },
    { label: "Số hóa đơn", value: invoice.invoiceNumber ?? "Chưa có" },
    {
      label: "Trạng thái HĐ",
      value:
        invoice.invoiceStatus === "ISSUED"
          ? "Đã phát hành"
          : invoice.invoiceStatus === "CANCELLED"
            ? "Đã hủy"
            : "Chưa phát hành",
    },
    {
      label: "Trạng thái ghi sổ",
      value: invoice.isPosted ? "Đã ghi sổ" : "Nháp",
    },
    {
      label: "Kiêm phiếu xuất kho",
      value: invoice.isDelivered ? "Có" : "Không",
    },
    {
      label: "Người ghi sổ",
      value: invoice.postedBy?.fullName ?? invoice.postedBy?.email ?? "—",
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
        {rows.map((item, i) =>
          item === null ? (
            <div
              key={`sep-${i}`}
              className="col-span-full border-t border-border/40"
            />
          ) : (
            <div key={item.label} className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">
                {item.label}
              </span>
              <span
                className={`text-sm ${item.bold ? "font-semibold text-primary" : ""}`}
              >
                {item.value}
              </span>
            </div>
          ),
        )}
      </div>
      {invoice.description && (
        <div className="border-t border-border/40 pt-3">
          <span className="text-xs text-muted-foreground block mb-0.5">
            Diễn giải
          </span>
          <p className="text-sm">{invoice.description}</p>
        </div>
      )}
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

// --- Date presets ---

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// --- suppress unused import warning ---
type _SalesInvoiceListItemUsed = SalesInvoiceListItem;

// --- Sort icon helper ---
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

// --- CSV export ---
function exportToCsv(rows: SalesInvoiceListItem[]) {
  const headers = [
    "Số chứng từ",
    "Ngày HT",
    "Khách hàng",
    "Tổng TT (VND)",
    "Số HĐ",
    "Trạng thái",
    "HĐ GTGT",
    "Người ghi sổ",
  ];
  const csvRows = rows.map((r) => [
    r.voucherNumber,
    fmtDate(r.accountingDate),
    r.customer.name,
    r.grandTotal,
    r.invoiceNumber ?? "",
    r.isPosted ? "Đã ghi sổ" : "Nháp",
    r.isInvoiced
      ? r.invoiceStatus === "ISSUED"
        ? "Đã phát hành"
        : r.invoiceStatus === "CANCELLED"
          ? "Đã hủy"
          : "Chưa phát hành"
      : "—",
    r.postedBy?.fullName ?? r.postedBy?.email ?? "—",
  ]);
  const content = [headers, ...csvRows]
    .map((row) =>
      row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const bom = "\uFEFF"; // UTF-8 BOM for Excel to read Vietnamese correctly
  const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chung-tu-ban-hang-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Main page ---

export default function SalesInvoicesPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  const queryClient = useQueryClient();

  // ── Search & basic filters ───────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [issuingId, setIssuingId] = useState<string | null>(null);

  // Filter panel state (pending = what user sees; applied = what query uses)
  const [pendingDateFrom, setPendingDateFrom] = useState("");
  const [pendingDateTo, setPendingDateTo] = useState("");
  const [pendingIsPosted, setPendingIsPosted] = useState("all");
  const [pendingIsInvoiced, setPendingIsInvoiced] = useState("all");
  const [pendingInvoiceStatus, setPendingInvoiceStatus] = useState("all");
  const [pendingIsDelivered, setPendingIsDelivered] = useState("all");
  const [pendingDatePreset, setPendingDatePreset] = useState("all");

  const [appliedDateFrom, setAppliedDateFrom] = useState<string | undefined>(
    undefined,
  );
  const [appliedDateTo, setAppliedDateTo] = useState<string | undefined>(
    undefined,
  );
  const [appliedIsPosted, setAppliedIsPosted] = useState<boolean | undefined>(
    undefined,
  );
  const [appliedIsInvoiced, setAppliedIsInvoiced] = useState<
    boolean | undefined
  >(undefined);
  const [appliedInvoiceStatus, setAppliedInvoiceStatus] = useState<
    "DRAFT" | "ISSUED" | "CANCELLED" | undefined
  >(undefined);
  const [appliedIsDelivered, setAppliedIsDelivered] = useState<
    boolean | undefined
  >(undefined);

  // ── Sort ────────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState<"accountingDate" | "grandTotal">(
    "accountingDate",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(field: "accountingDate" | "grandTotal") {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  }

  // ── Selection & pagination ──────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_LIMIT = 50;

  const {
    data: listData,
    isLoading: listLoading,
    isError: listError,
    refetch,
  } = useQuery({
    queryKey: [
      "sales-invoices",
      appliedDateFrom,
      appliedDateTo,
      appliedIsPosted,
      appliedIsInvoiced,
      appliedInvoiceStatus,
      appliedIsDelivered,
      sortBy,
      sortDir,
      page,
      token,
    ],
    queryFn: () =>
      api.salesInvoice
        .list(token, {
          dateFrom: appliedDateFrom,
          dateTo: appliedDateTo,
          isPosted: appliedIsPosted,
          isInvoiced: appliedIsInvoiced,
          invoiceStatus: appliedInvoiceStatus,
          isDelivered: appliedIsDelivered,
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
        r.customer.name.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["sales-invoice", selectedId, token],
    queryFn: () =>
      api.salesInvoice.getById(selectedId!, token).then((r) => r.data),
    enabled: !!token && !!selectedId,
    staleTime: 60_000,
  });

  const allChecked =
    filteredRows.length > 0 && filteredRows.every((r) => selectedIds.has(r.id));
  const someChecked =
    !allChecked && filteredRows.some((r) => selectedIds.has(r.id));
  const grandTotalSum = filteredRows.reduce(
    (sum, r) => sum + Number.parseFloat(r.grandTotal),
    0,
  );

  function toggleAll(checked: boolean) {
    setSelectedIds(
      checked ? new Set(filteredRows.map((r) => r.id)) : new Set(),
    );
  }

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  // ── Date preset helper ──────────────────────────────────────────────────
  function applyDatePreset(preset: string) {
    setPendingDatePreset(preset);
    const now = new Date();
    const today = toIsoDate(now);
    if (preset === "today") {
      setPendingDateFrom(today);
      setPendingDateTo(today);
    } else if (preset === "7d") {
      const from = new Date();
      from.setDate(from.getDate() - 7);
      setPendingDateFrom(toIsoDate(from));
      setPendingDateTo(today);
    } else if (preset === "month") {
      setPendingDateFrom(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
      );
      setPendingDateTo(today);
    } else if (preset === "quarter") {
      const qStart = new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3,
        1,
      );
      setPendingDateFrom(toIsoDate(qStart));
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
    setAppliedDateFrom(pendingDateFrom || undefined);
    setAppliedDateTo(pendingDateTo || undefined);
    setAppliedIsPosted(
      pendingIsPosted === "all" ? undefined : pendingIsPosted === "true",
    );
    setAppliedIsInvoiced(
      pendingIsInvoiced === "all" ? undefined : pendingIsInvoiced === "true",
    );
    setAppliedInvoiceStatus(
      pendingInvoiceStatus === "all"
        ? undefined
        : (pendingInvoiceStatus as "DRAFT" | "ISSUED" | "CANCELLED"),
    );
    setAppliedIsDelivered(
      pendingIsDelivered === "all" ? undefined : pendingIsDelivered === "true",
    );
    setPage(1);
    setShowFilter(false);
  }

  function handleResetFilter() {
    setPendingDateFrom("");
    setPendingDateTo("");
    setPendingIsPosted("all");
    setPendingIsInvoiced("all");
    setPendingInvoiceStatus("all");
    setPendingIsDelivered("all");
    setPendingDatePreset("all");
    applyDatePreset("all");
  }

  const totalPages = Math.ceil((listData?.total ?? 0) / PAGE_LIMIT);

  async function handleIssueInvoice(id: string) {
    setIssuingId(id);
    try {
      const result = await api.salesInvoice.issueInvoice(id, token);
      toast.success(
        `Phát hành hóa đơn thành công — Số HĐ: ${result.data.invoiceNumber ?? "—"}`,
        { duration: 5000 },
      );
      void queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      void queryClient.invalidateQueries({ queryKey: ["sales-invoice", id] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Lỗi khi phát hành hóa đơn",
      );
    } finally {
      setIssuingId(null);
    }
  }

  async function handleDeleteInvoice(id: string, voucherNumber: string) {
    if (
      !window.confirm(
        `Xóa chứng từ ${voucherNumber}? Thao tác này không thể hoàn tác.`,
      )
    )
      return;
    try {
      await api.salesInvoice.delete(id, token);
      toast.success(`Đã xóa chứng từ ${voucherNumber}`);
      if (selectedId === id) setSelectedId(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      void queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi xóa chứng từ");
    }
  }

  const selectedListItem =
    filteredRows.find((r) => r.id === selectedId) ?? null;

  // ── Active filter count badge ────────────────────────────────────────────
  const activeFilterCount = [
    appliedIsPosted !== undefined,
    appliedIsInvoiced !== undefined,
    appliedInvoiceStatus !== undefined,
    appliedIsDelivered !== undefined,
    appliedDateFrom !== undefined,
  ].filter(Boolean).length;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <ResizablePanelGroup direction="vertical">
        {/* Top: voucher list */}
        <ResizablePanel
          defaultSize={58}
          minSize={30}
          className="flex flex-col overflow-hidden"
        >
          {/* Toolbar */}
          <div className="px-3 py-2 border-b border-border bg-card flex items-center justify-between gap-2 shrink-0 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8"
                    disabled={selectedIds.size === 0}
                  >
                    <Layers size={14} />
                    Thực hiện hàng loạt
                    <ChevronDown size={12} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Ghi sổ các dòng đã chọn</DropdownMenuItem>
                  <DropdownMenuItem>
                    Phát hành hóa đơn hàng loạt
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    Xóa các dòng đã chọn
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
                  placeholder="Số chứng từ, khách hàng..."
                  className="pl-8 h-8 w-60 text-xs"
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
                title="Cài đặt cột"
              >
                <Settings2 size={15} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Xuất Excel"
                onClick={() => exportToCsv(filteredRows)}
                disabled={filteredRows.length === 0}
              >
                <FileDown size={15} />
              </Button>
              <Button
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => navigate("/sales/invoices/new")}
              >
                <Plus size={14} />
                Thêm mới
              </Button>
            </div>
          </div>

          {/* Filter panel */}
          {showFilter && (
            <div className="px-4 py-3 border-b border-border bg-muted/30 shrink-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div className="space-y-1">
                  <Label className="text-xs">Trạng thái ghi sổ</Label>
                  <Select
                    value={pendingIsPosted}
                    onValueChange={setPendingIsPosted}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="true">Đã ghi sổ</SelectItem>
                      <SelectItem value="false">Nháp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Trạng thái lập hóa đơn</Label>
                  <Select
                    value={pendingIsInvoiced}
                    onValueChange={(v) => {
                      setPendingIsInvoiced(v);
                      if (v !== "true") setPendingInvoiceStatus("all");
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="true">Có lập hóa đơn</SelectItem>
                      <SelectItem value="false">Không lập hóa đơn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Trạng thái phát hành</Label>
                  <Select
                    value={pendingInvoiceStatus}
                    onValueChange={setPendingInvoiceStatus}
                    disabled={pendingIsInvoiced !== "true"}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="DRAFT">Chưa phát hành</SelectItem>
                      <SelectItem value="ISSUED">Đã phát hành</SelectItem>
                      <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Trạng thái xuất hàng</Label>
                  <Select
                    value={pendingIsDelivered}
                    onValueChange={setPendingIsDelivered}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="true">Kèm phiếu xuất kho</SelectItem>
                      <SelectItem value="false">Không xuất kho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-end gap-3 flex-wrap">
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
          {listLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : listError ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-destructive">
              <AlertCircle size={24} />
              <p className="text-sm">
                Không thể tải danh sách. Vui lòng thử lại.
              </p>
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
                        aria-label="Chọn tất cả"
                      />
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap w-36">
                      Số chứng từ
                    </th>
                    <th
                      className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap w-28 cursor-pointer hover:text-foreground select-none"
                      onClick={() => toggleSort("accountingDate")}
                    >
                      <span className="inline-flex items-center">
                        Ngày HT
                        <SortIcon
                          field="accountingDate"
                          sortBy={sortBy}
                          sortDir={sortDir}
                        />
                      </span>
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">
                      Khách hàng
                    </th>
                    <th
                      className="px-3 py-2 text-right font-medium text-muted-foreground text-xs whitespace-nowrap w-36 cursor-pointer hover:text-foreground select-none"
                      onClick={() => toggleSort("grandTotal")}
                    >
                      <span className="inline-flex items-center justify-end w-full">
                        Tổng TT (VND)
                        <SortIcon
                          field="grandTotal"
                          sortBy={sortBy}
                          sortDir={sortDir}
                        />
                      </span>
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap w-28">
                      Số HĐ
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap w-28">
                      Trạng thái
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap w-28">
                      HĐ GTGT
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap w-32">
                      Người ghi sổ
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground text-xs whitespace-nowrap w-28">
                      Chức năng
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-3 py-12 text-center text-muted-foreground text-sm"
                      >
                        Không có dữ liệu.{" "}
                        <button
                          type="button"
                          className="text-primary underline hover:no-underline"
                          onClick={() => navigate("/sales/invoices/new")}
                        >
                          Thêm mới
                        </button>{" "}
                        để tạo chứng từ bán hàng đầu tiên.
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
                            aria-label={`Chọn ${inv.voucherNumber}`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-primary font-medium text-xs hover:underline cursor-pointer">
                            {inv.voucherNumber}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {fmtDate(inv.accountingDate)}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {inv.customer.name}
                        </td>
                        <td className="px-3 py-2 text-right text-xs font-mono font-medium">
                          {fmtVND(inv.grandTotal)}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {inv.invoiceNumber ?? "—"}
                        </td>
                        <td className="px-3 py-2">
                          <VoucherStatusBadge isPosted={inv.isPosted} />
                        </td>
                        <td className="px-3 py-2">
                          {inv.isInvoiced ? (
                            <InvoiceStatusBadge status={inv.invoiceStatus} />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {inv.postedBy?.fullName ?? inv.postedBy?.email ?? "—"}
                        </td>
                        <td
                          className="px-3 py-2 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1 text-primary hover:text-primary"
                              >
                                Chức năng <ChevronDown size={12} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="gap-2"
                                disabled={
                                  inv.invoiceStatus === "ISSUED" ||
                                  issuingId === inv.id
                                }
                                onClick={() => handleIssueInvoice(inv.id)}
                              >
                                {issuingId === inv.id ? (
                                  <>
                                    <Loader2
                                      size={13}
                                      className="animate-spin"
                                    />
                                    Đang phát hành…
                                  </>
                                ) : (
                                  <>
                                    <SendHorizontal size={13} />
                                    Phát hành hóa đơn
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/sales/invoices/${inv.id}`)
                                }
                              >
                                Xem
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/sales/invoices/${inv.id}/edit`)
                                }
                              >
                                Sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                disabled={
                                  inv.isPosted || inv.invoiceStatus !== "DRAFT"
                                }
                                onClick={() =>
                                  handleDeleteInvoice(inv.id, inv.voucherNumber)
                                }
                              >
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredRows.length > 0 && (
                  <tfoot className="sticky bottom-0 bg-muted/90 backdrop-blur-sm">
                    <tr className="border-t-2 border-border font-semibold text-xs">
                      <td className="px-3 py-2" colSpan={2}>
                        Tổng: {filteredRows.length} chứng từ
                      </td>
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2 text-right font-mono">
                        {fmtVND(grandTotalSum)}
                      </td>
                      <td className="px-3 py-2" colSpan={5} />
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

        {/* Bottom: detail panel */}
        <ResizablePanel
          defaultSize={42}
          minSize={20}
          className="flex flex-col overflow-hidden bg-card"
        >
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Chọn một chứng từ để xem chi tiết
            </div>
          ) : (
            <>
              <div className="px-4 py-2 border-b border-border flex items-center gap-3 shrink-0 flex-wrap">
                <span className="text-sm font-semibold text-primary">
                  {selectedListItem?.voucherNumber ?? selectedId}
                </span>
                {selectedListItem && (
                  <>
                    <span className="text-muted-foreground text-xs">|</span>
                    <span className="text-xs text-foreground">
                      {selectedListItem.customer.name}
                    </span>
                    <span className="text-muted-foreground text-xs">|</span>
                    <span className="text-xs text-muted-foreground">
                      {fmtDate(selectedListItem.voucherDate)}
                    </span>
                    <span className="text-muted-foreground text-xs">|</span>
                    <span className="text-xs font-mono font-medium">
                      {fmtVND(selectedListItem.grandTotal)} VND
                    </span>
                    <span className="ml-auto flex items-center gap-2">
                      <VoucherStatusBadge
                        isPosted={selectedListItem.isPosted}
                      />
                      {selectedListItem.isInvoiced && (
                        <InvoiceStatusBadge
                          status={selectedListItem.invoiceStatus}
                        />
                      )}
                    </span>
                  </>
                )}
              </div>

              <Tabs
                defaultValue="hang-tien"
                className="flex flex-col flex-1 min-h-0 overflow-hidden"
              >
                <TabsList className="h-9 px-2 rounded-none border-b border-border justify-start bg-transparent gap-0 shrink-0">
                  {(
                    [
                      { value: "hang-tien", label: "Hàng tiền" },
                      { value: "thong-ke", label: "Thống kê" },
                      { value: "thue", label: "Thuế" },
                      { value: "gia-von", label: "Giá vốn" },
                    ] as const
                  ).map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="rounded-none px-4 h-full text-xs border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent
                  value="hang-tien"
                  className="flex-1 min-h-0 overflow-auto m-0 p-0"
                >
                  {detailLoading || !detailData ? (
                    <DetailSkeleton />
                  ) : (
                    <HangTienTab invoice={detailData} />
                  )}
                </TabsContent>

                <TabsContent
                  value="thong-ke"
                  className="flex-1 min-h-0 overflow-auto m-0"
                >
                  {detailLoading || !detailData ? (
                    <DetailSkeleton />
                  ) : (
                    <ThongKeTab invoice={detailData} />
                  )}
                </TabsContent>

                <TabsContent value="thue" className="flex-1 m-0 overflow-auto">
                  {detailLoading || !detailData ? (
                    <DetailSkeleton />
                  ) : detailData.isInvoiced ? (
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">
                          Ký hiệu HĐ
                        </span>
                        <span className="text-sm">
                          {detailData.invoiceSeries ?? "—"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">
                          Số HĐ
                        </span>
                        <span className="text-sm">
                          {detailData.invoiceNumber ?? "—"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">
                          Ngày HĐ
                        </span>
                        <span className="text-sm">
                          {detailData.invoiceDate
                            ? fmtDate(detailData.invoiceDate)
                            : "—"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">
                          Trạng thái HĐ
                        </span>
                        <InvoiceStatusBadge status={detailData.invoiceStatus} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">
                          Thuế GTGT
                        </span>
                        <span className="text-sm font-semibold">
                          {fmtVND(detailData.vatAmount)} VND
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center mt-8 p-4">
                      Chứng từ này không lập kèm hóa đơn GTGT
                    </p>
                  )}
                </TabsContent>

                <TabsContent
                  value="gia-von"
                  className="flex-1 m-0 overflow-auto"
                >
                  {detailLoading || !detailData ? (
                    <DetailSkeleton />
                  ) : (
                    <table className="w-full text-xs border-collapse">
                      <thead className="sticky top-0 bg-muted/70 backdrop-blur-sm z-10">
                        <tr className="border-b border-border">
                          {[
                            "STT",
                            "Mã hàng",
                            "Tên hàng",
                            "ĐVT",
                            "SL",
                            "Giá vốn đơn vị",
                            "Giá vốn tổng",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap first:text-center"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detailData.details.map((d, i) => {
                          const qty = Number.parseFloat(d.qty);
                          const unitPrice = Number.parseFloat(d.unitPrice);
                          // giá vốn chưa có trong detail — hiển thị placeholder
                          return (
                            <tr
                              key={d.id}
                              className="border-b border-border/40 hover:bg-muted/30"
                            >
                              <td className="px-2 py-1.5 text-center text-muted-foreground">
                                {i + 1}
                              </td>
                              <td className="px-2 py-1.5 font-medium text-primary">
                                {d.item.sku}
                              </td>
                              <td className="px-2 py-1.5">{d.item.name}</td>
                              <td className="px-2 py-1.5">{d.item.unit}</td>
                              <td className="px-2 py-1.5 text-right font-mono">
                                {qty.toLocaleString("vi-VN")}
                              </td>
                              {d.item.itemType === "GOODS" ? (
                                <>
                                  <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">
                                    —
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">
                                    —
                                  </td>
                                </>
                              ) : (
                                <td
                                  className="px-2 py-1.5 text-muted-foreground text-center"
                                  colSpan={2}
                                >
                                  Dịch vụ / không theo dõi kho
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

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
  Layers,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BookCheck,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  type PurchaseInvoiceListItem,
  type PurchaseInvoiceFull,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtVND(value: string | number) {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isNaN(n) ? "0" : new Intl.NumberFormat("vi-VN").format(n);
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Badges ──────────────────────────────────────────────────────────────────

function VoucherStatusBadge({ isPosted }: Readonly<{ isPosted: boolean }>) {
  return isPosted ? (
    <Badge
      variant="outline"
      className="bg-success/10 text-success border-success/30 text-xs"
    >
      Đã ghi sổ
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="bg-muted text-muted-foreground border text-xs"
    >
      Nháp
    </Badge>
  );
}

// ─── HangTienTab (purchase invoice detail) ────────────────────────────────────

function HangTienTab({ invoice }: Readonly<{ invoice: PurchaseInvoiceFull }>) {
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
            TK CP
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
          const vatRate = Number.parseFloat(d.vatRate);
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
                {d.apAccount?.code ?? "331"}
              </td>
              <td className="px-2 py-1.5 text-center text-muted-foreground">
                {d.expAccount?.code ?? "156"}
              </td>
              <td className="px-2 py-1.5 text-center">{d.item.unit}</td>
              <td className="px-2 py-1.5 text-right font-mono">
                {qty.toLocaleString("vi-VN")}
              </td>
              <td className="px-2 py-1.5 text-right font-mono">
                {fmtVND(d.unitPrice)}
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
          <td colSpan={2} />
          <td className="px-2 py-1.5 text-right font-mono">
            {fmtVND(totalAmt)}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

// ─── ThongKeTab ───────────────────────────────────────────────────────────────

function ThongKeTab({ invoice }: Readonly<{ invoice: PurchaseInvoiceFull }>) {
  const rows = [
    {
      label: "Tiền hàng (chưa VAT)",
      value: `${fmtVND(invoice.totalAmount)} VND`,
    },
    { label: "Thuế GTGT đầu vào", value: `${fmtVND(invoice.vatAmount)} VND` },
    {
      label: "Tổng thanh toán",
      value: `${fmtVND(invoice.grandTotal)} VND`,
      bold: true,
    },
    null,
    {
      label: "Nhà cung cấp",
      value: `${invoice.supplier.code} — ${invoice.supplier.name}`,
    },
    { label: "Mã số thuế", value: invoice.supplier.taxCode ?? "—" },
    { label: "Địa chỉ", value: invoice.supplier.address ?? "—" },
    { label: "Người liên hệ", value: invoice.contactPerson ?? "—" },
    { label: "Tham chiếu", value: invoice.reference ?? "—" },
    null,
    { label: "Ngày hạch toán", value: fmtDate(invoice.accountingDate) },
    { label: "Ngày chứng từ", value: fmtDate(invoice.voucherDate) },
    {
      label: "Số ngày được nợ",
      value:
        invoice.paymentTermDays == null
          ? "—"
          : `${invoice.paymentTermDays} ngày`,
    },
    {
      label: "Hạn thanh toán",
      value: invoice.dueDate ? fmtDate(invoice.dueDate) : "—",
    },
    null,
    { label: "Ký hiệu HĐ NCC", value: invoice.invoiceSeries ?? "—" },
    { label: "Số HĐ NCC", value: invoice.invoiceNumber ?? "—" },
    {
      label: "Ngày HĐ NCC",
      value: invoice.invoiceDate ? fmtDate(invoice.invoiceDate) : "—",
    },
    {
      label: "Trạng thái ghi sổ",
      value: invoice.isPosted ? "Đã ghi sổ" : "Nháp",
    },
    {
      label: "Người ghi sổ",
      value: invoice.postedBy?.fullName ?? invoice.postedBy?.email ?? "—",
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
        {rows.map((item) =>
          item === null ? (
            <div
              key="separator"
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

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({
  field,
  sortBy,
  sortDir,
}: Readonly<{
  field: string;
  sortBy: string;
  sortDir: "asc" | "desc";
}>) {
  if (sortBy !== field)
    return <ArrowUpDown size={12} className="ml-1 opacity-40" />;
  return sortDir === "asc" ? (
    <ArrowUp size={12} className="ml-1 text-primary" />
  ) : (
    <ArrowDown size={12} className="ml-1 text-primary" />
  );
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportToCsv(rows: PurchaseInvoiceListItem[]) {
  const headers = [
    "Số chứng từ",
    "Ngày HT",
    "Nhà cung cấp",
    "Tổng TT (VND)",
    "Số HĐ NCC",
    "Hạn TT",
    "Trạng thái",
  ];
  const csvRows = rows.map((r) => [
    r.voucherNumber,
    fmtDate(r.accountingDate),
    r.supplier.name,
    r.grandTotal,
    r.invoiceNumber ?? "",
    r.dueDate ? fmtDate(r.dueDate) : "",
    r.isPosted ? "Đã ghi sổ" : "Nháp",
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
  a.download = `chung-tu-mua-hang-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main page ────────────────────────────────────────────────────────────────

// eslint-disable-next-line sonarjs/cognitive-complexity
export default function APInvoicesPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const queryClient = useQueryClient();
  const [postConfirmTarget, setPostConfirmTarget] = useState<{
    id: string;
    voucherNumber: string;
  } | null>(null);
  const [unpostConfirmTarget, setUnpostConfirmTarget] = useState<{
    id: string;
    voucherNumber: string;
  } | null>(null);

  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [postingId, setPostingId] = useState<string | null>(null);
  const [unpostingId, setUnpostingId] = useState<string | null>(null);

  const [pendingDateFrom, setPendingDateFrom] = useState("");
  const [pendingDateTo, setPendingDateTo] = useState("");
  const [pendingIsPosted, setPendingIsPosted] = useState("all");
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

  const [sortBy, setSortBy] = useState<"accountingDate" | "grandTotal">(
    "accountingDate",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_LIMIT = 50;

  function toggleSort(field: "accountingDate" | "grandTotal") {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  }

  const {
    data: listData,
    isLoading: listLoading,
    isError: listError,
    refetch,
  } = useQuery({
    queryKey: [
      "purchase-invoices",
      appliedDateFrom,
      appliedDateTo,
      appliedIsPosted,
      sortBy,
      sortDir,
      page,
      token,
    ],
    queryFn: () =>
      api.purchaseInvoice
        .list(token, {
          dateFrom: appliedDateFrom,
          dateTo: appliedDateTo,
          isPosted: appliedIsPosted,
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
        r.supplier.name.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const {
    data: detailData,
    isLoading: detailLoading,
    isError: detailError,
  } = useQuery({
    queryKey: ["purchase-invoice", selectedId, token],
    queryFn: async () => {
      if (!selectedId) {
        throw new Error("Missing invoice id");
      }
      return api.purchaseInvoice.getById(selectedId, token).then((r) => r.data);
    },
    enabled: !!token && !!selectedId,
    staleTime: 60_000,
  });

  const allChecked =
    filteredRows.length > 0 && filteredRows.every((r) => selectedIds.has(r.id));
  const someChecked =
    !allChecked && filteredRows.some((r) => selectedIds.has(r.id));
  const grandTotalSum = filteredRows.reduce(
    (s, r) => s + Number.parseFloat(r.grandTotal),
    0,
  );
  const selectedListItem =
    filteredRows.find((r) => r.id === selectedId) ?? null;

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
      const qs = new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3,
        1,
      );
      setPendingDateFrom(toIsoDate(qs));
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
    setPage(1);
    setShowFilter(false);
  }
  function handleResetFilter() {
    setPendingDateFrom("");
    setPendingDateTo("");
    setPendingIsPosted("all");
    setPendingDatePreset("all");
  }

  const totalPages = Math.ceil((listData?.total ?? 0) / PAGE_LIMIT);
  const activeFilterCount = [
    appliedIsPosted !== undefined,
    appliedDateFrom !== undefined,
  ].filter(Boolean).length;
  const totalRecords = search.trim()
    ? filteredRows.length
    : (listData?.total ?? 0);
  const recordCountText =
    selectedIds.size > 0
      ? `Đã chọn ${selectedIds.size} / ${filteredRows.length}`
      : `${totalRecords} bản ghi`;

  async function handlePostInvoice(id: string, voucherNumber: string) {
    setPostingId(id);
    try {
      await api.purchaseInvoice.post(id, token);
      toast.success(`Đã ghi sổ chứng từ ${voucherNumber}`);
      void queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
      void queryClient.invalidateQueries({
        queryKey: ["purchase-invoice", id],
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi ghi sổ");
    } finally {
      setPostingId(null);
    }
  }

  async function handleConfirmPostInvoice() {
    if (!postConfirmTarget) return;

    const { id, voucherNumber } = postConfirmTarget;
    setPostConfirmTarget(null);
    await handlePostInvoice(id, voucherNumber);
  }

  async function handleUnpostInvoice(id: string, voucherNumber: string) {
    setUnpostingId(id);
    try {
      await api.purchaseInvoice.unpost(id, token);
      toast.success(`Đã bỏ ghi chứng từ ${voucherNumber}`);
      void queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
      void queryClient.invalidateQueries({
        queryKey: ["purchase-invoice", id],
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Lỗi khi bỏ ghi chứng từ",
      );
    } finally {
      setUnpostingId(null);
    }
  }

  async function handleConfirmUnpostInvoice() {
    if (!unpostConfirmTarget) return;

    const { id, voucherNumber } = unpostConfirmTarget;
    setUnpostConfirmTarget(null);
    await handleUnpostInvoice(id, voucherNumber);
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <AlertDialog
        open={postConfirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPostConfirmTarget(null);
        }}
      >
        <AlertDialogContent className="max-w-md border-border/60 bg-card p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500/12 via-emerald-500/6 to-background px-6 pt-6 pb-4 border-b border-border/60">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600">
                <BookCheck size={20} />
              </div>
              <AlertDialogHeader className="space-y-2 text-left">
                <AlertDialogTitle className="text-base font-semibold text-foreground">
                  Xác nhận ghi sổ chứng từ
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
                  {"Chứng từ "}
                  <span className="font-semibold text-foreground">
                    {postConfirmTarget?.voucherNumber}
                  </span>
                  {" sẽ được chuyển từ nháp sang đã ghi sổ."}
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
              Sau khi ghi sổ, chứng từ sẽ bị khóa chỉnh sửa. Nếu cần sửa lại,
              bạn phải thực hiện thao tác bỏ ghi trước.
            </div>
          </div>

          <AlertDialogFooter className="border-t border-border/60 bg-muted/20 px-6 py-4">
            <AlertDialogCancel className="mt-0">Để sau</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmPostInvoice();
              }}
            >
              Xác nhận ghi sổ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={unpostConfirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setUnpostConfirmTarget(null);
        }}
      >
        <AlertDialogContent className="max-w-md border-border/60 bg-card p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-sky-500/12 via-sky-500/6 to-background px-6 pt-6 pb-4 border-b border-border/60">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/12 text-sky-600">
                <RotateCcw size={20} />
              </div>
              <AlertDialogHeader className="space-y-2 text-left">
                <AlertDialogTitle className="text-base font-semibold text-foreground">
                  Xác nhận bỏ ghi chứng từ
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
                  {"Chứng từ "}
                  <span className="font-semibold text-foreground">
                    {unpostConfirmTarget?.voucherNumber}
                  </span>
                  {" sẽ được chuyển về trạng thái nháp để tiếp tục chỉnh sửa."}
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="rounded-2xl border border-sky-200/70 bg-sky-50/80 px-4 py-3 text-sm text-sky-900">
              Thao tác này sẽ gỡ trạng thái ghi sổ và mở lại quyền sửa chứng từ.
              Sau đó bạn có thể cập nhật nội dung trước khi ghi sổ lại.
            </div>
          </div>

          <AlertDialogFooter className="border-t border-border/60 bg-muted/20 px-6 py-4">
            <AlertDialogCancel className="mt-0">Để sau</AlertDialogCancel>
            <AlertDialogAction
              className="bg-sky-600 text-white hover:bg-sky-700"
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmUnpostInvoice();
              }}
            >
              Xác nhận bỏ ghi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ResizablePanelGroup direction="vertical">
        {/* ── Top: list ── */}
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
                    <Layers size={14} /> Thực hiện hàng loạt{" "}
                    <ChevronDown size={12} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
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
                <Filter size={14} /> Lọc
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
                  placeholder="Số chứng từ, nhà cung cấp..."
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
                onClick={() => navigate("/ap/invoices/new")}
              >
                <Plus size={14} /> Thêm mới
              </Button>
            </div>
          </div>

          {/* Filter panel */}
          {showFilter && (
            <div className="px-4 py-3 border-b border-border bg-muted/30 shrink-0">
              <div className="flex items-end gap-3 flex-wrap">
                <div className="space-y-1">
                  <Label className="text-xs">Trạng thái ghi sổ</Label>
                  <Select
                    value={pendingIsPosted}
                    onValueChange={setPendingIsPosted}
                  >
                    <SelectTrigger className="h-8 text-xs w-40">
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
          ) : (
            <>
              {listError ? (
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
                            Ngày HT{" "}
                            <SortIcon
                              field="accountingDate"
                              sortBy={sortBy}
                              sortDir={sortDir}
                            />
                          </span>
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">
                          Nhà cung cấp
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap w-28">
                          Ngày HĐ NCC
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap w-28">
                          Số HĐ NCC
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap w-28">
                          Hạn TT
                        </th>
                        <th
                          className="px-3 py-2 text-right font-medium text-muted-foreground text-xs whitespace-nowrap w-36 cursor-pointer hover:text-foreground select-none"
                          onClick={() => toggleSort("grandTotal")}
                        >
                          <span className="inline-flex items-center justify-end w-full">
                            Tổng TT (VND){" "}
                            <SortIcon
                              field="grandTotal"
                              sortBy={sortBy}
                              sortDir={sortDir}
                            />
                          </span>
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap w-28">
                          Trạng thái
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
                            Không có dữ liệu chứng từ mua hàng.
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
                            <td className="px-3 py-2">
                              <span className="text-primary font-medium text-xs">
                                {inv.voucherNumber}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">
                              {fmtDate(inv.accountingDate)}
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {inv.supplier.name}
                            </td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">
                              {fmtDate(inv.invoiceDate)}
                            </td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">
                              {inv.invoiceNumber ?? "—"}
                            </td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">
                              {fmtDate(inv.dueDate)}
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
                                    disabled={inv.isPosted}
                                    onClick={() =>
                                      navigate(`/ap/invoices/${inv.id}/edit`)
                                    }
                                  >
                                    Sửa
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="gap-2"
                                    disabled={
                                      inv.isPosted || postingId === inv.id
                                    }
                                    onClick={() =>
                                      setPostConfirmTarget({
                                        id: inv.id,
                                        voucherNumber: inv.voucherNumber,
                                      })
                                    }
                                  >
                                    {postingId === inv.id ? (
                                      <Loader2
                                        size={13}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <BookCheck size={13} />
                                    )}
                                    Ghi sổ
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="gap-2"
                                    disabled={
                                      !inv.isPosted || unpostingId === inv.id
                                    }
                                    onClick={() =>
                                      setUnpostConfirmTarget({
                                        id: inv.id,
                                        voucherNumber: inv.voucherNumber,
                                      })
                                    }
                                  >
                                    {unpostingId === inv.id ? (
                                      <Loader2
                                        size={13}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <RotateCcw size={13} />
                                    )}
                                    Bỏ ghi
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
                          <td colSpan={5} />
                          <td className="px-3 py-2 text-right font-mono">
                            {fmtVND(grandTotalSum)}
                          </td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          <div className="px-4 py-1.5 border-t border-border bg-card flex items-center justify-between shrink-0">
            <span className="text-xs text-muted-foreground">
              {recordCountText}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                Trang {page}/{totalPages || 1}
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

        {/* ── Bottom: detail panel ── */}
        <ResizablePanel
          defaultSize={42}
          minSize={20}
          className="flex flex-col overflow-hidden bg-card"
        >
          {selectedId ? (
            detailLoading ? (
              <div className="flex-1 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Đang tải chi tiết chứng từ...</span>
              </div>
            ) : detailError || !detailData ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-destructive">
                <AlertCircle size={20} />
                <p className="text-sm">Không thể tải chi tiết chứng từ.</p>
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
                        {selectedListItem.supplier.name}
                      </span>
                      <span className="text-muted-foreground text-xs">|</span>
                      <span className="text-xs text-muted-foreground">
                        {fmtDate(selectedListItem.voucherDate)}
                      </span>
                      <span className="text-muted-foreground text-xs">|</span>
                      <span className="text-xs font-mono font-medium">
                        {fmtVND(selectedListItem.grandTotal)} VND
                      </span>
                      <span className="ml-auto">
                        <VoucherStatusBadge
                          isPosted={selectedListItem.isPosted}
                        />
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
                    <HangTienTab invoice={detailData} />
                  </TabsContent>
                  <TabsContent
                    value="thong-ke"
                    className="flex-1 min-h-0 overflow-auto m-0"
                  >
                    <ThongKeTab invoice={detailData} />
                  </TabsContent>
                </Tabs>
              </>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Chọn một chứng từ để xem chi tiết
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

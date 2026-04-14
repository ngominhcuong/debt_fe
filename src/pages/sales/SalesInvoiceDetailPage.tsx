import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Pencil,
  ArrowLeft,
  Loader2,
  AlertCircle,
  SendHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { api, type InvoiceStatus } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function fmtVND(value: string | number) {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isNaN(n) ? "0" : new Intl.NumberFormat("vi-VN").format(n);
}

function InfoRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string | React.ReactNode;
  bold?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm ${bold ? "font-semibold text-primary" : ""}`}>
        {value}
      </span>
    </div>
  );
}

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
    <Badge variant="outline" className="text-xs text-muted-foreground">
      Nháp
    </Badge>
  );
}

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg: Record<InvoiceStatus, { label: string; className: string }> = {
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
  const c = cfg[status];
  return (
    <Badge variant="outline" className={c.className}>
      {c.label}
    </Badge>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SalesInvoiceDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const queryClient = useQueryClient();

  const {
    data: resp,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["sales-invoice", id, token],
    queryFn: () => api.salesInvoice.getById(id!, token),
    enabled: !!token && !!id,
    staleTime: 60_000,
  });

  const inv = resp?.data;

  async function handleIssue() {
    if (!id) return;
    try {
      const result = await api.salesInvoice.issueInvoice(id, token);
      toast.success(result.message ?? "Phát hành hóa đơn thành công");
      void queryClient.invalidateQueries({ queryKey: ["sales-invoice", id] });
      void queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Lỗi khi phát hành hóa đơn",
      );
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center gap-2 p-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Đang tải chứng từ...</span>
      </div>
    );
  }

  if (isError || !inv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-12 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="font-medium">Không tải được chứng từ</p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </div>
    );
  }

  // Totals
  const totalAmt = Number.parseFloat(inv.totalAmount);
  const vatAmt = Number.parseFloat(inv.vatAmount);
  const grandTotal = Number.parseFloat(inv.grandTotal);

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-xl font-semibold leading-tight">
              {inv.voucherNumber}
            </h1>
            <p className="text-sm text-muted-foreground">{inv.customer.name}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <VoucherStatusBadge isPosted={inv.isPosted} />
            {inv.isInvoiced && (
              <InvoiceStatusBadge status={inv.invoiceStatus} />
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {inv.invoiceStatus !== "ISSUED" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleIssue}
            >
              <SendHorizontal size={14} />
              Phát hành hóa đơn
            </Button>
          )}
          {!inv.isPosted && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => navigate(`/sales/invoices/${id}/edit`)}
            >
              <Pencil size={14} />
              Sửa
            </Button>
          )}
          <Button size="sm" onClick={() => navigate("/sales/invoices")}>
            Danh sách
          </Button>
        </div>
      </div>

      {/* ── Info cards — 2 col ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Left — customer & transaction detail */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Thông tin chứng từ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <InfoRow label="Mã khách hàng" value={inv.customer.code} />
              <InfoRow label="Tên khách hàng" value={inv.customer.name} />
              <InfoRow
                label="Mã số thuế / CCCD"
                value={inv.customer.taxCode ?? "—"}
              />
              <InfoRow label="Địa chỉ" value={inv.customer.address ?? "—"} />
              <InfoRow label="Người liên hệ" value={inv.contactPerson ?? "—"} />
              <InfoRow
                label="Nhân viên bán hàng"
                value={inv.salesPersonName ?? "—"}
              />
              <InfoRow label="Tham chiếu" value={inv.reference ?? "—"} />
              {inv.description && (
                <div className="col-span-full flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">
                    Diễn giải
                  </span>
                  <span className="text-sm">{inv.description}</span>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <InfoRow
                label="Ngày hạch toán"
                value={fmtDate(inv.accountingDate)}
              />
              <InfoRow label="Ngày chứng từ" value={fmtDate(inv.voucherDate)} />
              <InfoRow label="Số chứng từ" value={inv.voucherNumber} bold />
              <InfoRow
                label="Số ngày được nợ"
                value={
                  inv.paymentTermDays != null
                    ? `${inv.paymentTermDays} ngày`
                    : "—"
                }
              />
              <InfoRow label="Hạn thanh toán" value={fmtDate(inv.dueDate)} />
              <InfoRow
                label="Người ghi sổ"
                value={inv.postedBy?.fullName ?? inv.postedBy?.email ?? "—"}
              />
            </div>
          </CardContent>
        </Card>

        {/* Right — financial summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng hợp tài chính
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tổng tiền hàng</span>
              <span className="font-mono font-medium">{fmtVND(totalAmt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Thuế GTGT</span>
              <span className="font-mono font-medium">{fmtVND(vatAmt)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-semibold">Tổng thanh toán</span>
              <span className="font-mono font-bold text-primary text-base">
                {fmtVND(grandTotal)}
              </span>
            </div>

            <Separator className="mt-2" />

            <InfoRow
              label="Cờ chứng từ"
              value={
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {inv.isDelivered && (
                    <Badge variant="secondary" className="text-xs">
                      Kèm xuất kho
                    </Badge>
                  )}
                  {inv.isInvoiced && (
                    <Badge variant="secondary" className="text-xs">
                      Kèm HĐ GTGT
                    </Badge>
                  )}
                  {!inv.isDelivered && !inv.isInvoiced && (
                    <span className="text-sm text-muted-foreground">
                      Chứng từ ghi nợ thuần
                    </span>
                  )}
                </div>
              }
            />

            {inv.isInvoiced && (
              <>
                <Separator />
                <InfoRow label="Ký hiệu HĐ" value={inv.invoiceSeries ?? "—"} />
                <InfoRow label="Số HĐ" value={inv.invoiceNumber ?? "—"} />
                <InfoRow label="Ngày HĐ" value={fmtDate(inv.invoiceDate)} />
                <InfoRow
                  label="Trạng thái HĐ"
                  value={<InvoiceStatusBadge status={inv.invoiceStatus} />}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs — detail grid + sub-docs ────────────────────────────────── */}
      <Tabs defaultValue="hang-tien">
        <TabsList className="mb-0">
          <TabsTrigger value="hang-tien">Hàng tiền</TabsTrigger>
          {inv.isDelivered && (
            <TabsTrigger value="xuat-kho">Phiếu xuất kho</TabsTrigger>
          )}
          {inv.isInvoiced && (
            <TabsTrigger value="hoa-don">Hóa đơn GTGT</TabsTrigger>
          )}
        </TabsList>

        {/* Tab 1: Line items */}
        <TabsContent value="hang-tien" className="mt-0">
          <Card className="rounded-tl-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted border-b">
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground w-10">
                      STT
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[120px]">
                      Mã hàng
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Tên hàng
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Diễn giải
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[80px]">
                      Kho
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[90px]">
                      TK Nợ
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[90px]">
                      TK Có
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[50px]">
                      ĐVT
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground w-[80px]">
                      SL
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground w-[110px]">
                      Đơn giá
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground w-[60px]">
                      VAT%
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground w-[120px]">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inv.details.map((d, i) => {
                    const qty = Number.parseFloat(d.qty);
                    const unitPrice = Number.parseFloat(d.unitPrice);
                    const vatRate = Number.parseFloat(d.vatRate);
                    const lineAmt = Number.parseFloat(d.amount);
                    return (
                      <tr
                        key={d.id}
                        className="border-b border-border/40 hover:bg-muted/20"
                      >
                        <td className="px-3 py-2 text-center text-xs text-muted-foreground">
                          {i + 1}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-primary">
                          {d.item.sku}
                        </td>
                        <td className="px-3 py-2 text-sm">{d.item.name}</td>
                        <td className="px-3 py-2 text-sm text-muted-foreground">
                          {d.description ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-sm text-muted-foreground">
                          {d.warehouse?.name ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-sm text-muted-foreground">
                          {d.arAccount?.code ?? "131"}
                        </td>
                        <td className="px-3 py-2 text-sm text-muted-foreground">
                          {d.revAccount?.code ?? "511"}
                        </td>
                        <td className="px-3 py-2 text-sm">{d.item.unit}</td>
                        <td className="px-3 py-2 text-right text-sm font-mono">
                          {qty.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-mono">
                          {fmtVND(unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right text-sm">
                          {vatRate}%
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-mono font-medium">
                          {fmtVND(lineAmt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-muted/60">
                  <tr className="border-t-2 border-border font-semibold text-sm">
                    <td
                      colSpan={8}
                      className="px-3 py-2 text-xs text-muted-foreground"
                    >
                      {inv.details.length} dòng
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {inv.details
                        .reduce((s, d) => s + Number.parseFloat(d.qty), 0)
                        .toLocaleString("vi-VN")}
                    </td>
                    <td colSpan={2} />
                    <td className="px-3 py-2 text-right font-mono">
                      {fmtVND(totalAmt)}
                    </td>
                  </tr>
                  <tr className="text-sm">
                    <td
                      colSpan={10}
                      className="px-3 py-1 text-right text-muted-foreground"
                    >
                      Thuế GTGT:
                    </td>
                    <td
                      colSpan={2}
                      className="px-3 py-1 text-right font-mono font-medium"
                    >
                      {fmtVND(vatAmt)}
                    </td>
                  </tr>
                  <tr className="text-sm font-bold">
                    <td colSpan={10} className="px-3 py-2 text-right">
                      Tổng thanh toán:
                    </td>
                    <td
                      colSpan={2}
                      className="px-3 py-2 text-right font-mono text-primary text-base"
                    >
                      {fmtVND(grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Phiếu xuất kho (placeholder — full data in later module) */}
        {inv.isDelivered && (
          <TabsContent value="xuat-kho" className="mt-0">
            <Card className="rounded-tl-none">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Chứng từ được tạo kèm phiếu xuất kho. Bút toán Nợ 632 / Có 156
                  đã được hạch toán khi ghi sổ.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab 3: Hóa đơn GTGT */}
        {inv.isInvoiced && (
          <TabsContent value="hoa-don" className="mt-0">
            <Card className="rounded-tl-none">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl">
                  <InfoRow
                    label="Ký hiệu hóa đơn"
                    value={inv.invoiceSeries ?? "—"}
                  />
                  <InfoRow
                    label="Số hóa đơn"
                    value={inv.invoiceNumber ?? "—"}
                  />
                  <InfoRow
                    label="Ngày hóa đơn"
                    value={fmtDate(inv.invoiceDate)}
                  />
                  <InfoRow
                    label="Trạng thái"
                    value={<InvoiceStatusBadge status={inv.invoiceStatus} />}
                  />
                  <InfoRow
                    label="Thuế GTGT đầu ra"
                    value={`${fmtVND(vatAmt)} VND`}
                    bold
                  />
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Bút toán Nợ 131 / Có 3331 đã được tạo tự động khi ghi sổ.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

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
}: Readonly<{
  label: string;
  value: string | React.ReactNode;
  bold?: boolean;
}>) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm ${bold ? "font-semibold text-primary" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function VoucherStatusBadge({ isPosted }: Readonly<{ isPosted: boolean }>) {
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

export default function ARReceiptDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["receipt-detail", id, token],
    queryFn: () => {
      if (!id) throw new Error("Missing receipt id");
      return api.receipt.getById(id, token);
    },
    enabled: !!id && !!token,
    staleTime: 60_000,
  });

  const receipt = response?.data;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center gap-2 p-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Đang tải chứng từ...</span>
      </div>
    );
  }

  if (isError || !receipt) {
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

  const totalAmount = Number.parseFloat(receipt.totalAmount);

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
              {receipt.receiptNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              {receipt.customer.name}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <VoucherStatusBadge isPosted={receipt.lines.length > 0} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate("/ar/receipts")}>
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
              <InfoRow label="Mã khách hàng" value={receipt.customer.code} />
              <InfoRow label="Tên khách hàng" value={receipt.customer.name} />
              <InfoRow
                label="Mã số thuế / CCCD"
                value={receipt.customer.taxCode ?? "—"}
              />
              <InfoRow
                label="Địa chỉ"
                value={receipt.customer.address ?? "—"}
              />
              <InfoRow label="Người nộp" value={receipt.submitter ?? "—"} />
              <InfoRow label="Lý do" value={receipt.reason ?? "—"} />
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <InfoRow
                label="Ngày hạch toán"
                value={fmtDate(receipt.accountingDate)}
              />
              <InfoRow
                label="Ngày phiếu thu"
                value={fmtDate(receipt.receiptDate)}
              />
              <InfoRow label="Số chứng từ" value={receipt.receiptNumber} bold />
            </div>

            {receipt.notes && (
              <>
                <Separator className="my-4" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Ghi chú</span>
                  <span className="text-sm">{receipt.notes}</span>
                </div>
              </>
            )}
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
              <span className="text-muted-foreground">Tổng tiền thu</span>
              <span className="font-mono font-medium">
                {fmtVND(totalAmount)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-semibold">Tổng thanh toán</span>
              <span className="font-mono font-bold text-primary text-base">
                {fmtVND(totalAmount)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs — detail grid ──────────────────────────────────────────── */}
      <Tabs defaultValue="hang-tien">
        <TabsList className="mb-0">
          <TabsTrigger value="hang-tien">Chi tiết hạch toán</TabsTrigger>
        </TabsList>

        {/* Tab: Line items */}
        <TabsContent value="hang-tien" className="mt-0">
          <Card className="rounded-tl-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted border-b">
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground w-10">
                      STT
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[110px]">
                      TK Nợ
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[110px]">
                      TK Có
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground w-[120px]">
                      Số tiền
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Diễn giải
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.lines.map((line, i) => (
                    <tr
                      key={line.id}
                      className="border-b border-border/40 hover:bg-muted/20"
                    >
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {line.debitAccount.code}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {line.creditAccount.code}
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-mono font-semibold">
                        {fmtVND(line.amount)}
                      </td>
                      <td className="px-3 py-2 text-sm text-muted-foreground">
                        {line.description || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

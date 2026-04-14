import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, type CreatePaymentLinePayload } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineRow {
  id: string; // client-only key
  debitAccountId: string; // 331* AP account
  creditAccountId: string; // 111/112 cash/bank
  amount: string; // string for controlled input
  description: string;
}

interface Props {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  totalRemaining?: number;
  token: string;
  onClose: () => void;
  onSuccess?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}

function fmtVND(val: number) {
  return new Intl.NumberFormat("vi-VN").format(val);
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function APPaymentDialog({
  supplierId,
  supplierCode,
  supplierName,
  totalRemaining,
  token,
  onClose,
  onSuccess,
}: Readonly<Props>) {
  // ── form state ──
  const [paymentDate, setPaymentDate] = useState(today());
  const [accountingDate, setAccountingDate] = useState(today());
  const [recipient, setRecipient] = useState("");
  const [reason, setReason] = useState(`Chi tiền cho ${supplierName}`);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineRow[]>([]);

  // ── fetch defaults ──
  const defaultsQuery = useQuery({
    queryKey: ["payment-defaults", supplierId, token],
    queryFn: () =>
      api.payment.getDefaults(supplierId, token).then((r) => r.data),
    enabled: !!token && !!supplierId,
    staleTime: 60_000,
  });

  const defaults = defaultsQuery.data;
  const cashAccounts = defaults?.cashAccounts ?? [];
  const allAccounts = defaults?.allAccounts ?? [];

  // default credit = first 111* account; fallback to first cash account
  const defaultCreditId =
    cashAccounts.find((a) => a.code.startsWith("111"))?.id ??
    cashAccounts[0]?.id ??
    "";

  // populate default line once defaults load
  useEffect(() => {
    if (defaults && lines.length === 0) {
      setLines([
        {
          id: uid(),
          debitAccountId: defaults.defaultDebitAccountId ?? "",
          creditAccountId: defaultCreditId,
          amount:
            totalRemaining != null && totalRemaining > 0
              ? String(totalRemaining)
              : "",
          description: `Chi tiền cho ${supplierName}`,
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaults]);

  // ── mutations ──
  const createMutation = useMutation({
    mutationFn: () => {
      const payload = {
        supplierId,
        paymentDate,
        accountingDate,
        recipient: recipient || undefined,
        reason: reason || undefined,
        notes: notes || undefined,
        lines: lines.map<CreatePaymentLinePayload>((l) => ({
          debitAccountId: l.debitAccountId,
          creditAccountId: l.creditAccountId,
          amount: Number.parseFloat(l.amount) || 0,
          description: l.description,
        })),
      };
      return api.payment.create(payload, token);
    },
    onSuccess: (res) => {
      toast.success(`Đã lưu phiếu chi ${res.data.paymentNumber}`, {
        duration: 5000,
      });
      onSuccess?.();
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Lỗi khi lưu phiếu chi");
    },
  });

  // ── line operations ──
  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        id: uid(),
        debitAccountId: defaults?.defaultDebitAccountId ?? "",
        creditAccountId: defaultCreditId,
        amount: "",
        description: "",
      },
    ]);
  }

  function updateLine(
    id: string,
    field: keyof Omit<LineRow, "id">,
    value: string,
  ) {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    );
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  function clearLines() {
    setLines([]);
  }

  // ── totals ──
  const totalAmount = lines.reduce(
    (s, l) => s + (Number.parseFloat(l.amount) || 0),
    0,
  );

  // ── validation ──
  const isValid =
    paymentDate &&
    accountingDate &&
    lines.length > 0 &&
    lines.every(
      (l) =>
        l.debitAccountId &&
        l.creditAccountId &&
        Number.parseFloat(l.amount) > 0,
    );

  const saving = createMutation.isPending;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span>Phiếu chi tiền</span>
            {defaultsQuery.isLoading && (
              <Loader2
                className="animate-spin text-muted-foreground"
                size={14}
              />
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ── Supplier info ── */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Mã đối tượng
              </Label>
              <div className="h-8 px-3 flex items-center border rounded-md bg-muted/40 text-sm font-medium">
                {supplierCode}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Tên đối tượng
              </Label>
              <div className="h-8 px-3 flex items-center border rounded-md bg-muted/40 text-sm">
                {supplierName}
              </div>
            </div>
            {totalRemaining != null && (
              <div className="space-y-1 col-span-2">
                <Label className="text-xs text-muted-foreground">Còn nợ</Label>
                <div className="h-8 px-3 flex items-center border rounded-md bg-muted/40 text-sm font-mono text-destructive font-medium">
                  {fmtVND(totalRemaining)} VNĐ
                </div>
              </div>
            )}
          </div>

          {/* ── Dates + recipient + reason ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="paymentDate" className="text-xs">
                Ngày phiếu chi <span className="text-destructive">*</span>
              </Label>
              <Input
                id="paymentDate"
                type="date"
                className="h-8 text-sm"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="accountingDate" className="text-xs">
                Ngày hạch toán <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accountingDate"
                type="date"
                className="h-8 text-sm"
                value={accountingDate}
                onChange={(e) => setAccountingDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="recipient" className="text-xs">
                Người nhận tiền
              </Label>
              <Input
                id="recipient"
                className="h-8 text-sm"
                placeholder="Nhập tên người nhận..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reason" className="text-xs">
                Lý do chi
              </Label>
              <Input
                id="reason"
                className="h-8 text-sm"
                placeholder="Lý do chi tiền..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          {/* ── Accounting lines ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Hạch toán
              </Label>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={addLine}
                  disabled={defaultsQuery.isLoading}
                >
                  <Plus size={12} /> Thêm dòng
                </Button>
                {lines.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                    onClick={clearLines}
                  >
                    <X size={12} /> Xóa hết dòng
                  </Button>
                )}
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60 border-b">
                    <th className="px-2 py-1.5 text-left font-medium text-xs w-8">
                      #
                    </th>
                    <th className="px-2 py-1.5 text-left font-medium text-xs">
                      TK Nợ
                    </th>
                    <th className="px-2 py-1.5 text-left font-medium text-xs">
                      TK Có (111/112)
                    </th>
                    <th className="px-2 py-1.5 text-right font-medium text-xs">
                      Số tiền
                    </th>
                    <th className="px-2 py-1.5 text-left font-medium text-xs">
                      Diễn giải
                    </th>
                    <th className="px-2 py-1.5 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-4 text-xs text-muted-foreground"
                      >
                        Chưa có dòng hạch toán. Nhấn "Thêm dòng" để thêm.
                      </td>
                    </tr>
                  ) : (
                    lines.map((line, idx) => (
                      <tr key={line.id} className="border-b last:border-0">
                        <td className="px-2 py-1 text-xs text-muted-foreground text-center">
                          {idx + 1}
                        </td>

                        {/* TK Nợ — all accounts (accountant chooses freely) */}
                        <td className="px-2 py-1 min-w-[160px]">
                          <Select
                            value={line.debitAccountId}
                            onValueChange={(v) =>
                              updateLine(line.id, "debitAccountId", v)
                            }
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Chọn TK..." />
                            </SelectTrigger>
                            <SelectContent>
                              {allAccounts.map((acc) => (
                                <SelectItem
                                  key={acc.id}
                                  value={acc.id}
                                  className="text-xs"
                                >
                                  {acc.code} — {acc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>

                        {/* TK Có — cash/bank accounts (111/112) */}
                        <td className="px-2 py-1 min-w-[160px]">
                          <Select
                            value={line.creditAccountId}
                            onValueChange={(v) =>
                              updateLine(line.id, "creditAccountId", v)
                            }
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Chọn TK..." />
                            </SelectTrigger>
                            <SelectContent>
                              {cashAccounts.map((acc) => (
                                <SelectItem
                                  key={acc.id}
                                  value={acc.id}
                                  className="text-xs"
                                >
                                  {acc.code} — {acc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Số tiền */}
                        <td className="px-2 py-1 min-w-[130px]">
                          <Input
                            className="h-7 text-xs text-right font-mono"
                            placeholder="0"
                            value={line.amount}
                            onChange={(e) => {
                              const v = e.target.value.replaceAll(
                                /[^0-9.,]/g,
                                "",
                              );
                              updateLine(
                                line.id,
                                "amount",
                                v.replaceAll(",", "."),
                              );
                            }}
                          />
                        </td>

                        {/* Diễn giải */}
                        <td className="px-2 py-1">
                          <Input
                            className="h-7 text-xs"
                            placeholder="Diễn giải..."
                            value={line.description}
                            onChange={(e) =>
                              updateLine(line.id, "description", e.target.value)
                            }
                          />
                        </td>

                        {/* Remove */}
                        <td className="px-2 py-1 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => removeLine(line.id)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Total */}
            {lines.length > 0 && (
              <div className="flex justify-end text-sm font-semibold gap-2 pr-10">
                <span className="text-muted-foreground">Tổng chi:</span>
                <span className="font-mono">{fmtVND(totalAmount)} VNĐ</span>
              </div>
            )}
          </div>

          {/* ── Notes ── */}
          <div className="space-y-1">
            <Label htmlFor="notes" className="text-xs">
              Ghi chú
            </Label>
            <Textarea
              id="notes"
              className="text-sm resize-none"
              rows={2}
              placeholder="Ghi chú thêm..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!isValid || saving}
              onClick={() => createMutation.mutate()}
            >
              {saving && <Loader2 className="animate-spin mr-1.5" size={13} />}
              Lưu phiếu chi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

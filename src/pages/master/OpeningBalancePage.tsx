import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save,
  Lock,
  Eye,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import PageToolbar from "@/components/shared/PageToolbar";
import {
  api,
  type PeriodOpeningBalanceRow,
  type ClosingPreviewRow,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtVND(val: number): string {
  if (val === 0) return "";
  return new Intl.NumberFormat("vi-VN").format(Math.round(val));
}

function fmtBalance(val: number) {
  if (val < 0)
    return (
      <span className="text-destructive">
        ({new Intl.NumberFormat("vi-VN").format(Math.round(-val))})
      </span>
    );
  if (val === 0) return <span className="text-muted-foreground">—</span>;
  return <>{new Intl.NumberFormat("vi-VN").format(Math.round(val))}</>;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function getDefaultYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OpeningBalancePage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const qc = useQueryClient();

  const { year: defYear, month: defMonth } = getDefaultYearMonth();
  const [year, setYear] = useState(defYear);
  const [month, setMonth] = useState(defMonth);

  // Local edit state: accountId → { debit, credit }
  const [edits, setEdits] = useState<
    Record<string, { debit: string; credit: string }>
  >({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  // ── Queries ──

  const periodQuery = useQuery({
    queryKey: ["period", year, month, token],
    queryFn: () => api.period.getInfo(year, month, token).then((r) => r.data),
    enabled: !!token,
    staleTime: 30_000,
  });

  const previewQuery = useQuery({
    queryKey: ["period-preview", year, month, token],
    queryFn: () =>
      api.period.getClosingPreview(year, month, token).then((r) => r.data),
    enabled: previewOpen && !!token,
    staleTime: 10_000,
  });

  const period = periodQuery.data;
  const isClosed = period?.status === "CLOSED";

  // Populate local edits when data loads (only first time or when year/month changes)
  const lastLoaded = useRef("");
  useEffect(() => {
    const key = `${year}-${month}`;
    if (period && lastLoaded.current !== key) {
      lastLoaded.current = key;
      const init: Record<string, { debit: string; credit: string }> = {};
      period.openingBalances.forEach((row) => {
        init[row.accountId] = {
          debit: row.debitAmount > 0 ? String(row.debitAmount) : "",
          credit: row.creditAmount > 0 ? String(row.creditAmount) : "",
        };
      });
      setEdits(init);
    }
  }, [period, year, month]);

  // ── Mutations ──

  const saveMutation = useMutation({
    mutationFn: () => {
      const balances = (period?.openingBalances ?? []).map((row) => ({
        accountId: row.accountId,
        debitAmount: parseFloat(edits[row.accountId]?.debit || "0") || 0,
        creditAmount: parseFloat(edits[row.accountId]?.credit || "0") || 0,
      }));
      return api.period.saveBalances(year, month, balances, token);
    },
    onSuccess: () => {
      toast({ title: "Đã lưu số dư đầu kỳ" });
      qc.invalidateQueries({ queryKey: ["period", year, month] });
    },
    onError: (e: any) => {
      toast({
        title: "Lỗi",
        description: e?.message ?? "Không thể lưu",
        variant: "destructive",
      });
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => api.period.close(year, month, token),
    onSuccess: (res) => {
      toast({
        title: "Chốt sổ thành công",
        description: res.data
          ? `Đã chuyển số dư sang kỳ ${res.data.nextMonth}/${res.data.nextYear}`
          : undefined,
      });
      setConfirmClose(false);
      setPreviewOpen(false);
      qc.invalidateQueries({ queryKey: ["period"] });
    },
    onError: (e: any) => {
      toast({
        title: "Lỗi chốt sổ",
        description: e?.message ?? "Không thể chốt sổ",
        variant: "destructive",
      });
    },
  });

  // ── Handlers ──

  function handleEdit(
    accountId: string,
    field: "debit" | "credit",
    value: string,
  ) {
    // Allow numeric input only
    const cleaned = value.replace(/[^0-9.]/g, "");
    setEdits((prev) => ({
      ...prev,
      [accountId]: {
        ...(prev[accountId] ?? { debit: "", credit: "" }),
        [field]: cleaned,
      },
    }));
  }

  // ── Render ──

  const years = Array.from({ length: 5 }, (_, i) => defYear - 2 + i);

  return (
    <>
      <PageToolbar onExport={() => {}} />

      {/* ── Period selector ── */}
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div>
          <Label className="text-xs mb-1 block">Năm</Label>
          <Select
            value={String(year)}
            onValueChange={(v) => {
              setYear(Number(v));
              lastLoaded.current = "";
            }}
          >
            <SelectTrigger className="h-8 text-sm w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)} className="text-xs">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs mb-1 block">Tháng</Label>
          <Select
            value={String(month)}
            onValueChange={(v) => {
              setMonth(Number(v));
              lastLoaded.current = "";
            }}
          >
            <SelectTrigger className="h-8 text-sm w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={String(m)} className="text-xs">
                  Tháng {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 ml-2">
          {isClosed ? (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Lock size={11} /> Đã chốt sổ
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-xs text-green-600 border-green-400"
            >
              Đang mở
            </Badge>
          )}
          {period?.closedAt && (
            <span className="text-xs text-muted-foreground">
              Chốt lúc {new Date(period.closedAt).toLocaleString("vi-VN")}
              {period.closedBy && ` bởi ${period.closedBy}`}
            </span>
          )}
        </div>

        <div className="flex gap-2 ml-auto">
          {!isClosed && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || periodQuery.isFetching}
            >
              {saveMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              Lưu số dư
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            onClick={() => setPreviewOpen(true)}
            disabled={periodQuery.isFetching}
          >
            <Eye size={13} /> Xem số dư cuối kỳ
          </Button>
          {!isClosed && (
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => setConfirmClose(true)}
              disabled={closeMutation.isPending}
            >
              <Lock size={13} /> Chốt sổ
            </Button>
          )}
        </div>
      </div>

      {/* ── Loading ── */}
      {periodQuery.isFetching && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-sm">
          <Loader2 className="animate-spin" size={18} /> Đang tải...
        </div>
      )}

      {/* ── Balance table ── */}
      {period && !periodQuery.isFetching && (
        <div className="bg-card rounded-lg border border-border overflow-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-muted/60 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <th className="text-left px-3 py-2 w-24">Mã TK</th>
                <th className="text-left px-3 py-2">Tên tài khoản</th>
                <th className="text-right px-3 py-2 w-40">
                  Dư Nợ đầu kỳ (VNĐ)
                </th>
                <th className="text-right px-3 py-2 w-40">
                  Dư Có đầu kỳ (VNĐ)
                </th>
              </tr>
            </thead>
            <tbody>
              {period.openingBalances.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-8 text-xs text-muted-foreground"
                  >
                    Không có tài khoản chi tiết nào
                  </td>
                </tr>
              ) : (
                period.openingBalances.map((row: PeriodOpeningBalanceRow) => {
                  const edit = edits[row.accountId] ?? {
                    debit: "",
                    credit: "",
                  };
                  return (
                    <tr
                      key={row.accountId}
                      className="border-b last:border-0 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-3 py-1.5 font-mono text-xs text-primary">
                        {row.accountCode}
                      </td>
                      <td className="px-3 py-1.5 text-xs">{row.accountName}</td>
                      <td className="px-3 py-1.5">
                        {isClosed ? (
                          <span className="text-right block font-mono text-xs">
                            {fmtVND(row.debitAmount)}
                          </span>
                        ) : (
                          <Input
                            className="h-7 text-right text-xs font-mono w-full"
                            value={edit.debit}
                            placeholder="0"
                            onChange={(e) =>
                              handleEdit(row.accountId, "debit", e.target.value)
                            }
                          />
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        {isClosed ? (
                          <span className="text-right block font-mono text-xs">
                            {fmtVND(row.creditAmount)}
                          </span>
                        ) : (
                          <Input
                            className="h-7 text-right text-xs font-mono w-full"
                            value={edit.credit}
                            placeholder="0"
                            onChange={(e) =>
                              handleEdit(
                                row.accountId,
                                "credit",
                                e.target.value,
                              )
                            }
                          />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Closing Balance Preview Dialog ── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Số dư cuối kỳ — Tháng {month}/{year}
            </DialogTitle>
            <DialogDescription>
              Kết quả tính toán: Dư đầu kỳ + Phát sinh Nợ − Phát sinh Có
            </DialogDescription>
          </DialogHeader>

          {previewQuery.isFetching && (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
              <Loader2 size={16} className="animate-spin" /> Đang tính...
            </div>
          )}

          {previewQuery.data && !previewQuery.isFetching && (
            <div className="overflow-auto">
              <table className="w-full text-xs min-w-[600px]">
                <thead>
                  <tr className="bg-muted/60 border-b font-semibold text-muted-foreground">
                    <th className="text-left px-3 py-2 w-20">Mã TK</th>
                    <th className="text-left px-3 py-2">Tên tài khoản</th>
                    <th className="text-right px-3 py-2 w-32">Dư đầu kỳ</th>
                    <th className="text-right px-3 py-2 w-28">PS Nợ</th>
                    <th className="text-right px-3 py-2 w-28">PS Có</th>
                    <th className="text-right px-3 py-2 w-32">Dư cuối kỳ</th>
                  </tr>
                </thead>
                <tbody>
                  {(previewQuery.data as ClosingPreviewRow[]).map((row) => (
                    <tr
                      key={row.accountId}
                      className="border-b last:border-0 hover:bg-muted/10"
                    >
                      <td className="px-3 py-1.5 font-mono text-primary">
                        {row.accountCode}
                      </td>
                      <td className="px-3 py-1.5">{row.accountName}</td>
                      <td className="px-3 py-1.5 text-right font-mono">
                        {fmtBalance(row.openingBalance)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono">
                        {row.periodDebit > 0
                          ? new Intl.NumberFormat("vi-VN").format(
                              row.periodDebit,
                            )
                          : "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono">
                        {row.periodCredit > 0
                          ? new Intl.NumberFormat("vi-VN").format(
                              row.periodCredit,
                            )
                          : "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono font-semibold">
                        {fmtBalance(row.closingBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isClosed && (
            <DialogFooter className="mt-2">
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Đóng
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                onClick={() => {
                  setPreviewOpen(false);
                  setConfirmClose(true);
                }}
              >
                <Lock size={13} /> Tiến hành chốt sổ
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Confirm Close Dialog ── */}
      <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              Xác nhận chốt sổ tháng {month}/{year}
            </DialogTitle>
            <DialogDescription>
              Thao tác này sẽ:
              <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                <li>
                  Khóa kỳ{" "}
                  <strong>
                    {month}/{year}
                  </strong>{" "}
                  — không thể sửa số dư đầu kỳ sau khi chốt
                </li>
                <li>Tính số dư cuối kỳ cho tất cả tài khoản</li>
                <li>
                  Tự động tạo số dư đầu kỳ cho tháng{" "}
                  <strong>
                    {month === 12 ? 1 : month + 1}/
                    {month === 12 ? year + 1 : year}
                  </strong>
                </li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmClose(false)}
              disabled={closeMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
              onClick={() => closeMutation.mutate()}
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Đang chốt...
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} /> Xác nhận chốt sổ
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

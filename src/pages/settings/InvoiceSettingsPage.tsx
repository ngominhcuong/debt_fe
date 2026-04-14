import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  api,
  type InvoiceSetting,
  type InvoiceSettingPayload,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SYMBOL_REGEX = /^[CK]\d{2}[TDLM][A-Z]{2}$/;

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  year: string;
  symbol: string;
  templateCode: string;
  startNumber: string;
  isActive: boolean;
}

function emptyForm(): FormState {
  return {
    year: String(currentYear),
    symbol: "",
    templateCode: "1",
    startNumber: "1",
    isActive: false,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InvoiceSettingsPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const queryClient = useQueryClient();

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["invoice-settings"],
    queryFn: () => api.invoiceSetting.list(token),
    enabled: !!token,
  });

  const settings = data?.data ?? [];

  // ── Modal state ───────────────────────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editCurrentNumber, setEditCurrentNumber] = useState(0);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [symbolError, setSymbolError] = useState("");

  function openCreate() {
    setEditId(null);
    setEditCurrentNumber(0);
    setForm(emptyForm());
    setSymbolError("");
    setOpen(true);
  }

  function openEdit(s: InvoiceSetting) {
    setEditId(s.id);
    setEditCurrentNumber(s.currentNumber);
    setForm({
      year: String(s.year),
      symbol: s.symbol,
      templateCode: s.templateCode,
      startNumber: String(s.startNumber),
      isActive: s.isActive,
    });
    setSymbolError("");
    setOpen(true);
  }

  function handleSymbolChange(v: string) {
    const upper = v.toUpperCase();
    setForm((f) => ({ ...f, symbol: upper }));
    if (upper && !SYMBOL_REGEX.test(upper)) {
      setSymbolError(
        "Định dạng: [C|K] + 2 số năm + [T|D|L|M] + 2 chữ hoa. VD: C26TAA",
      );
    } else {
      setSymbolError("");
    }
  }

  // ── Mutations ─────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!SYMBOL_REGEX.test(form.symbol))
        throw new Error("Ký hiệu không hợp lệ");
      if (editId) {
        return api.invoiceSetting.update(
          editId,
          {
            symbol: form.symbol,
            templateCode: form.templateCode,
            startNumber: Number(form.startNumber),
            isActive: form.isActive,
          },
          token,
        );
      }
      const payload: InvoiceSettingPayload = {
        year: Number(form.year),
        symbol: form.symbol,
        templateCode: form.templateCode,
        startNumber: Number(form.startNumber),
        isActive: form.isActive,
      };
      return api.invoiceSetting.create(payload, token);
    },
    onSuccess: () => {
      toast.success(editId ? "Đã cập nhật dải hóa đơn" : "Đã thêm dải hóa đơn");
      void queryClient.invalidateQueries({ queryKey: ["invoice-settings"] });
      setOpen(false);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Lỗi khi lưu"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.invoiceSetting.update(id, { isActive }, token),
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái");
      void queryClient.invalidateQueries({ queryKey: ["invoice-settings"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Lỗi cập nhật"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.invoiceSetting.delete(id, token),
    onSuccess: () => {
      toast.success("Đã xóa dải hóa đơn");
      void queryClient.invalidateQueries({ queryKey: ["invoice-settings"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Lỗi khi xóa"),
  });

  function handleDelete(s: InvoiceSetting) {
    if (!window.confirm(`Xóa dải hóa đơn ${s.symbol} năm ${s.year}?`)) return;
    deleteMutation.mutate(s.id);
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dải hóa đơn</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý ký hiệu và dải số hóa đơn đã đăng ký với cơ quan Thuế
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          Thêm dải hóa đơn
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Danh sách dải hóa đơn</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[80px]">Năm</TableHead>
                <TableHead>Ký hiệu</TableHead>
                <TableHead>Mẫu số</TableHead>
                <TableHead className="text-right">Số bắt đầu</TableHead>
                <TableHead className="text-right">Đã dùng</TableHead>
                <TableHead className="text-right">Số hiện tại</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : settings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Chưa có dải hóa đơn nào. Nhấn "Thêm dải hóa đơn" để bắt đầu.
                  </TableCell>
                </TableRow>
              ) : (
                settings.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.year}</TableCell>
                    <TableCell>
                      <span className="font-mono font-semibold">
                        {s.symbol}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {s.templateCode === "1"
                        ? "Hóa đơn GTGT"
                        : `Mẫu ${s.templateCode}`}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s.startNumber.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s.currentNumber.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {s.currentNumber > 0
                        ? String(s.currentNumber).padStart(7, "0")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={s.isActive}
                          onCheckedChange={(v) =>
                            toggleMutation.mutate({ id: s.id, isActive: v })
                          }
                        />
                        {s.isActive ? (
                          <Badge variant="default" className="text-xs">
                            Đang dùng
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Không dùng
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(s)}
                          disabled={s.currentNumber > 0}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Create / Edit Modal ─────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Sửa dải hóa đơn" : "Thêm dải hóa đơn"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Year */}
            <div className="space-y-1">
              <Label>
                Năm <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.year}
                onValueChange={(v) => setForm((f) => ({ ...f, year: v }))}
                disabled={!!editId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Symbol */}
            <div className="space-y-1">
              <Label>
                Ký hiệu hóa đơn <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.symbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                placeholder="VD: C26TAA"
                maxLength={20}
                disabled={!!editId && editCurrentNumber > 0}
                className={symbolError ? "border-destructive" : ""}
              />
              {symbolError ? (
                <p className="text-xs text-destructive">{symbolError}</p>
              ) : editId && editCurrentNumber > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Không thể đổi ký hiệu sau khi đã phát hành hóa đơn (
                  {editCurrentNumber} số đã dùng)
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  [C|K] + 2 số năm + [T|D|L|M] + 2 chữ hoa. VD: C26TAA, K26DAB
                </p>
              )}
            </div>

            {/* Template code */}
            <div className="space-y-1">
              <Label>Mẫu số hóa đơn</Label>
              <Select
                value={form.templateCode}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, templateCode: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 – Hóa đơn GTGT</SelectItem>
                  <SelectItem value="2">2 – Hóa đơn bán hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start number */}
            <div className="space-y-1">
              <Label>Số bắt đầu</Label>
              <Input
                type="number"
                min={1}
                value={form.startNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startNumber: e.target.value }))
                }
                disabled={!!editId}
              />
            </div>

            {/* Active */}
            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Sử dụng dải này để phát hành hóa đơn
              </Label>
            </div>
            {form.isActive && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                Khi kích hoạt, các dải hóa đơn khác cùng năm sẽ tự động bị tắt.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !!symbolError}
            >
              {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

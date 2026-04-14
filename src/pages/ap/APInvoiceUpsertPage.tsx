import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  api,
  type Item,
  type Partner,
  type Account,
  type PurchaseInvoiceDetailPayload,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DetailRow {
  _key: string;
  itemId: string;
  warehouseId: string;
  description: string;
  qty: string;
  unitPrice: string;
  vatRate: string;
  apAccountId: string;
  expAccountId: string;
}

function emptyRow(): DetailRow {
  return {
    _key: crypto.randomUUID(),
    itemId: "",
    warehouseId: "",
    description: "",
    qty: "1",
    unitPrice: "0",
    vatRate: "10",
    apAccountId: "",
    expAccountId: "",
  };
}

function toLocalDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function APInvoiceUpsertPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEdit = Boolean(editId);
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  // ── Master data ──────────────────────────────────────────────────────────
  const [suppliers, setSuppliers] = useState<Partner[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    if (!token) return;
    api.master
      .listPartners(token, { partnerType: "SUPPLIER", isActive: true })
      .then((r) => setSuppliers(r.data))
      .catch(() => undefined);
    api.master
      .listItems(token, { isActive: true })
      .then((r) => setItems(r.data))
      .catch(() => undefined);
    api.master
      .listAccounts(token, { isActive: true })
      .then((r) => setAccounts(r.data))
      .catch(() => undefined);
  }, [token]);

  // ── Header form ──────────────────────────────────────────────────────────
  const today = toLocalDateStr(new Date());
  const [supplierId, setSupplierId] = useState("");
  const [description, setDescription] = useState("");
  const [accountingDate, setAccountingDate] = useState(today);
  const [voucherDate, setVoucherDate] = useState(today);
  const [voucherNumber, setVoucherNumber] = useState("");

  const [contactPerson, setContactPerson] = useState("");
  const [reference, setReference] = useState("");
  const [paymentTermDays, setPaymentTermDays] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // Payment mode
  const [paymentMode, setPaymentMode] = useState<"PENDING" | "IMMEDIATE">(
    "PENDING",
  );
  // Nhận kèm hóa đơn flag
  const [withInvoice, setWithInvoice] = useState(false);

  // Supplier invoice reference fields
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceSeries, setInvoiceSeries] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today);

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === supplierId),
    [suppliers, supplierId],
  );

  // Auto-calc due date when voucherDate or paymentTermDays change
  useEffect(() => {
    const days = Number.parseInt(paymentTermDays, 10);
    if (voucherDate && !Number.isNaN(days) && days >= 0) {
      const d = new Date(voucherDate);
      d.setDate(d.getDate() + days);
      setDueDate(toLocalDateStr(d));
    }
  }, [voucherDate, paymentTermDays]);

  // Auto-fill paymentTermDays from supplier (create mode only)
  useEffect(() => {
    if (selectedSupplier?.paymentTermDays != null && !isEdit) {
      setPaymentTermDays(String(selectedSupplier.paymentTermDays));
    }
  }, [selectedSupplier, isEdit]);

  // ── Detail rows ──────────────────────────────────────────────────────────
  const [rows, setRows] = useState<DetailRow[]>([emptyRow()]);

  function updateRow(key: string, field: keyof DetailRow, value: string) {
    setRows((prev) =>
      prev.map((r) => (r._key === key ? { ...r, [field]: value } : r)),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((r) => r._key !== key);
    });
  }

  // Auto-fill unit price, VAT rate, and expense account from item master
  function handleItemChange(key: string, itemId: string) {
    const item = items.find((i) => i.id === itemId);
    setRows((prev) =>
      prev.map((r) => {
        if (r._key !== key) return r;
        return {
          ...r,
          itemId,
          unitPrice: item?.purchasePrice ?? "0",
          vatRate: item?.vatRate ?? "10",
          apAccountId: "",
          expAccountId: item?.inventoryAccountId ?? "",
        };
      }),
    );
  }

  // ── Totals (auto-calc) ───────────────────────────────────────────────────
  const { totalAmount, vatAmount, grandTotal } = useMemo(() => {
    let total = 0;
    let vat = 0;
    for (const r of rows) {
      const qty = Number.parseFloat(r.qty) || 0;
      const price = Number.parseFloat(r.unitPrice) || 0;
      const rate = Number.parseFloat(r.vatRate) || 0;
      const lineAmount = qty * price;
      total += lineAmount;
      vat += lineAmount * (rate / 100);
    }
    return { totalAmount: total, vatAmount: vat, grandTotal: total + vat };
  }, [rows]);

  // ── Edit mode: load existing data ────────────────────────────────────────
  useEffect(() => {
    if (!isEdit || !editId || !token) return;
    api.purchaseInvoice
      .getById(editId, token)
      .then((resp) => {
        const inv = resp.data;
        setSupplierId(inv.supplier.id);
        setDescription(inv.description ?? "");
        setAccountingDate(inv.accountingDate.slice(0, 10));
        setVoucherDate(inv.voucherDate.slice(0, 10));
        setVoucherNumber(inv.voucherNumber);
        setContactPerson(inv.contactPerson ?? "");
        setReference(inv.reference ?? "");
        setPaymentTermDays(
          inv.paymentTermDays == null ? "" : String(inv.paymentTermDays),
        );
        setDueDate(inv.dueDate ? inv.dueDate.slice(0, 10) : "");
        setInvoiceNumber(inv.invoiceNumber ?? "");
        setInvoiceSeries(inv.invoiceSeries ?? "");
        setInvoiceDate(inv.invoiceDate ? inv.invoiceDate.slice(0, 10) : today);
        setNotes(inv.notes ?? "");
        if (inv.details && inv.details.length > 0) {
          setRows(
            inv.details.map((d) => ({
              _key: crypto.randomUUID(),
              itemId: d.item.id,
              warehouseId: d.warehouse?.id ?? "",
              description: d.description ?? "",
              qty: d.qty,
              unitPrice: d.unitPrice,
              vatRate: d.vatRate,
              apAccountId: d.apAccount?.id ?? "",
              expAccountId: d.expAccount?.id ?? "",
            })),
          );
        }
      })
      .catch(() => {
        toast.error("Không tải được chứng từ");
        navigate("/ap/invoices");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, editId, token]);

  // ── Submission ───────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);

  function buildPayload(isPosted: boolean) {
    const details: PurchaseInvoiceDetailPayload[] = rows
      .filter((r) => r.itemId)
      .map((r, i) => ({
        itemId: r.itemId,
        warehouseId: r.warehouseId || undefined,
        description: r.description || undefined,
        qty: Number.parseFloat(r.qty) || 0,
        unitPrice: Number.parseFloat(r.unitPrice) || 0,
        vatRate: Number.parseFloat(r.vatRate) || 0,
        apAccountId: r.apAccountId || undefined,
        expAccountId: r.expAccountId || undefined,
        sortOrder: i,
      }));

    const ptDays = Number.parseInt(paymentTermDays, 10);

    return {
      voucherDate,
      accountingDate,
      supplierId,
      description: description || undefined,
      isPosted,
      invoiceNumber: invoiceNumber || undefined,
      invoiceSeries: invoiceSeries || undefined,
      invoiceDate: invoiceDate || undefined,
      contactPerson: contactPerson || undefined,
      reference: reference || undefined,
      paymentTermDays: Number.isNaN(ptDays) ? undefined : ptDays,
      dueDate: dueDate || undefined,
      notes: notes || undefined,
      details,
    };
  }

  async function handleSave(isPosted: boolean) {
    if (!supplierId) {
      toast.error("Vui lòng chọn nhà cung cấp");
      return;
    }
    if (rows.filter((r) => r.itemId).length === 0) {
      toast.error("Vui lòng nhập ít nhất một dòng hàng hóa");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && editId) {
        const result = await api.purchaseInvoice.update(
          editId,
          buildPayload(isPosted),
          token,
        );
        toast.success(result.message ?? "Cập nhật thành công");
      } else {
        const result = await api.purchaseInvoice.create(
          buildPayload(isPosted),
          token,
        );
        toast.success(result.message ?? "Lưu thành công");
      }
      navigate("/ap/invoices");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi lưu chứng từ");
    } finally {
      setSaving(false);
    }
  }

  // ─── UI ───────────────────────────────────────────────────────────────────

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(n);

  const apAccount331 = accounts.find((a) => a.code === "331");

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto">
      {/* ── Page title + action buttons ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isEdit ? "Sửa chứng từ mua hàng" : "Chứng từ mua hàng"}
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Hủy
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Lưu nháp"}
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu và Ghi sổ"}
          </Button>
        </div>
      </div>

      {/* ── Flags card: payment mode + withInvoice toggle ────────────────── */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-8">
            <RadioGroup
              value={paymentMode}
              onValueChange={(v) =>
                setPaymentMode(v as "PENDING" | "IMMEDIATE")
              }
              className="flex gap-4"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="PENDING" id="pay-pending" />
                <Label
                  htmlFor="pay-pending"
                  className="cursor-pointer text-sm font-normal"
                >
                  Chưa thanh toán
                </Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="IMMEDIATE" id="pay-immediate" />
                <Label
                  htmlFor="pay-immediate"
                  className="cursor-pointer text-sm font-normal"
                >
                  Thanh toán ngay
                </Label>
              </div>
            </RadioGroup>
            <Separator orientation="vertical" className="h-6" />
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium">
              <Checkbox
                checked={withInvoice}
                onCheckedChange={(v) => setWithInvoice(Boolean(v))}
              />
              Nhận kèm hóa đơn GTGT
            </label>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabs at top level ─────────────────────────────────────────────── */}
      <Tabs defaultValue="phieu-nhap">
        <TabsList className="mb-0">
          <TabsTrigger value="phieu-nhap">Phiếu nhập</TabsTrigger>
          <TabsTrigger value="hoa-don" disabled={!withInvoice}>
            Hóa đơn
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Header form + detail table ─────────────────────────── */}
        <TabsContent value="phieu-nhap" className="mt-0">
          <Card className="rounded-tl-none">
            <CardContent className="pt-4">
              {/* Header form: left 3-col grid + right dates column */}
              <div className="grid grid-cols-[1fr_200px] gap-0 border rounded-md mb-4">
                <div className="p-4 grid grid-cols-3 gap-x-3 gap-y-3 border-r">
                  {/* Row 1 */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Mã nhà cung cấp
                    </Label>
                    <Select value={supplierId} onValueChange={setSupplierId}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Chọn NCC..." />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.code} — {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Tên nhà cung cấp
                    </Label>
                    <Input
                      readOnly
                      value={selectedSupplier?.name ?? ""}
                      className="h-8 text-sm bg-muted"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Mã số thuế
                    </Label>
                    <Input
                      readOnly
                      value={selectedSupplier?.taxCode ?? ""}
                      className="h-8 text-sm bg-muted"
                    />
                  </div>

                  {/* Row 2 */}
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Địa chỉ
                    </Label>
                    <Input
                      readOnly
                      value={selectedSupplier?.address ?? ""}
                      className="h-8 text-sm bg-muted"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Người giao hàng
                    </Label>
                    <Input
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="h-8 text-sm"
                      placeholder="Họ tên..."
                      maxLength={120}
                    />
                  </div>

                  {/* Row 3 */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Nhân viên mua hàng
                    </Label>
                    <Input
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="h-8 text-sm"
                      placeholder="Tên nhân viên..."
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Số ngày được nợ
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={paymentTermDays}
                      onChange={(e) => setPaymentTermDays(e.target.value)}
                      className="h-8 text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Hạn thanh toán
                    </Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Row 4 */}
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Diễn giải
                    </Label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="h-8 text-sm"
                      placeholder="Nội dung chứng từ..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Ghi chú
                    </Label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="h-8 text-sm"
                      placeholder="Ghi chú..."
                    />
                  </div>
                </div>

                {/* Right: dates + voucher number */}
                <div className="p-4 flex flex-col gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Ngày hạch toán
                    </Label>
                    <Input
                      type="date"
                      value={accountingDate}
                      onChange={(e) => setAccountingDate(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Ngày chứng từ
                    </Label>
                    <Input
                      type="date"
                      value={voucherDate}
                      onChange={(e) => setVoucherDate(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Số phiếu nhập
                    </Label>
                    <Input
                      readOnly
                      value={isEdit ? voucherNumber : "Tự động tạo"}
                      className="h-8 text-sm bg-muted text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Detail table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted border-b">
                      <th className="px-2 py-2 text-center font-medium w-8 border-r">
                        #
                      </th>
                      <th className="px-2 py-2 text-left font-medium w-[140px] border-r">
                        Mã hàng
                      </th>
                      <th className="px-2 py-2 text-left font-medium w-[180px] border-r">
                        Tên hàng
                      </th>
                      <th className="px-2 py-2 text-left font-medium w-[80px] border-r">
                        Kho
                      </th>
                      <th className="px-2 py-2 text-left font-medium w-[110px] border-r">
                        TK Kho
                      </th>
                      <th className="px-2 py-2 text-left font-medium w-[110px] border-r">
                        TK Công nợ
                      </th>
                      <th className="px-2 py-2 text-center font-medium w-[56px] border-r">
                        ĐVT
                      </th>
                      <th className="px-2 py-2 text-right font-medium w-[80px] border-r">
                        Số lượng
                      </th>
                      <th className="px-2 py-2 text-right font-medium w-[100px] border-r">
                        Đơn giá
                      </th>
                      <th className="px-2 py-2 text-right font-medium w-[100px] border-r">
                        Thành tiền
                      </th>
                      <th className="px-2 py-2 text-right font-medium w-[72px] border-r">
                        % Thuế
                      </th>
                      <th className="px-2 py-2 text-right font-medium w-[90px] border-r">
                        Tiền thuế
                      </th>
                      <th className="px-2 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => {
                      const lineQty = Number.parseFloat(row.qty) || 0;
                      const linePrice = Number.parseFloat(row.unitPrice) || 0;
                      const lineVatRate = Number.parseFloat(row.vatRate) || 0;
                      const lineAmount = lineQty * linePrice;
                      const lineVat = (lineAmount * lineVatRate) / 100;
                      const selectedItem = items.find(
                        (i) => i.id === row.itemId,
                      );

                      return (
                        <tr
                          key={row._key}
                          className={cn(
                            "border-b hover:bg-muted/30",
                            idx % 2 !== 0 && "bg-muted/10",
                          )}
                        >
                          <td className="px-2 py-1 text-center text-muted-foreground border-r">
                            {idx + 1}
                          </td>

                          <td className="p-1 border-r">
                            <Select
                              value={row.itemId}
                              onValueChange={(v) =>
                                handleItemChange(row._key, v)
                              }
                            >
                              <SelectTrigger className="h-7 text-xs border-0 shadow-none focus:ring-0 px-1">
                                <SelectValue placeholder="Chọn..." />
                              </SelectTrigger>
                              <SelectContent>
                                {items.map((it) => (
                                  <SelectItem key={it.id} value={it.id}>
                                    {it.sku} — {it.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>

                          <td className="px-2 py-1 border-r text-xs">
                            {selectedItem?.name ?? ""}
                          </td>

                          <td className="p-1 border-r">
                            <Input
                              className="h-7 text-xs border-0 shadow-none focus-visible:ring-0 px-1"
                              value={row.warehouseId}
                              onChange={(e) =>
                                updateRow(
                                  row._key,
                                  "warehouseId",
                                  e.target.value,
                                )
                              }
                              placeholder="Kho..."
                            />
                          </td>

                          <td className="p-1 border-r">
                            <Select
                              value={row.expAccountId}
                              onValueChange={(v) =>
                                updateRow(row._key, "expAccountId", v)
                              }
                            >
                              <SelectTrigger className="h-7 text-xs border-0 shadow-none focus:ring-0 px-1">
                                <SelectValue placeholder="156/..." />
                              </SelectTrigger>
                              <SelectContent>
                                {accounts
                                  .filter(
                                    (a) =>
                                      a.accountType === "ASSET" ||
                                      a.accountType === "EXPENSE",
                                  )
                                  .map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                      {a.code} — {a.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </td>

                          <td className="p-1 border-r">
                            <Select
                              value={
                                row.apAccountId || (apAccount331?.id ?? "")
                              }
                              onValueChange={(v) =>
                                updateRow(row._key, "apAccountId", v)
                              }
                            >
                              <SelectTrigger className="h-7 text-xs border-0 shadow-none focus:ring-0 px-1">
                                <SelectValue placeholder="331" />
                              </SelectTrigger>
                              <SelectContent>
                                {accounts
                                  .filter((a) => a.accountType === "LIABILITY")
                                  .map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                      {a.code} — {a.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </td>

                          <td className="px-2 py-1 text-center border-r text-xs">
                            {selectedItem?.unit ?? ""}
                          </td>

                          <td className="p-1 border-r">
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              className="h-7 text-xs text-right border-0 shadow-none focus-visible:ring-0 px-1"
                              value={row.qty}
                              onChange={(e) =>
                                updateRow(row._key, "qty", e.target.value)
                              }
                            />
                          </td>

                          <td className="p-1 border-r">
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              className="h-7 text-xs text-right border-0 shadow-none focus-visible:ring-0 px-1"
                              value={row.unitPrice}
                              onChange={(e) =>
                                updateRow(row._key, "unitPrice", e.target.value)
                              }
                            />
                          </td>

                          <td className="px-2 py-1 text-right tabular-nums border-r">
                            {fmtCurrency(lineAmount)}
                          </td>

                          <td className="p-1 border-r">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              className={cn(
                                "h-7 text-xs text-right border-0 shadow-none focus-visible:ring-0 px-1",
                                row.itemId && "bg-muted/50",
                              )}
                              value={row.vatRate}
                              readOnly={!!row.itemId}
                              onChange={(e) =>
                                !row.itemId &&
                                updateRow(row._key, "vatRate", e.target.value)
                              }
                            />
                          </td>

                          <td className="px-2 py-1 text-right tabular-nums border-r">
                            {fmtCurrency(lineVat)}
                          </td>

                          <td className="p-1 text-center">
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-destructive text-base leading-none px-1"
                              onClick={() => removeRow(row._key)}
                              aria-label="Xóa dòng"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* + Thêm dòng */}
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={addRow}
                >
                  + Thêm dòng
                </Button>
              </div>

              {/* Totals */}
              <div className="mt-4 flex justify-end">
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm min-w-[280px]">
                  <span className="text-muted-foreground">Tổng tiền hàng</span>
                  <span className="text-right tabular-nums font-medium">
                    {fmtCurrency(totalAmount)}
                  </span>
                  <span className="text-muted-foreground">Thuế GTGT</span>
                  <span className="text-right tabular-nums font-medium">
                    {fmtCurrency(vatAmount)}
                  </span>
                  <Separator className="col-span-2 my-1" />
                  <span className="font-semibold">Tổng thanh toán</span>
                  <span className="text-right tabular-nums font-bold text-primary">
                    {fmtCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Hóa đơn GTGT đầu vào ──────────────────────────────── */}
        <TabsContent value="hoa-don" className="mt-0">
          <Card
            className={cn(
              "rounded-tl-none",
              !withInvoice && "opacity-50 pointer-events-none",
            )}
          >
            <CardHeader>
              <CardTitle className="text-base">
                Thông tin hóa đơn GTGT đầu vào
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 max-w-2xl">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Ký hiệu hóa đơn
                  </Label>
                  <Input
                    value={invoiceSeries}
                    onChange={(e) => setInvoiceSeries(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="VD: 1C25TTT"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Số hóa đơn
                  </Label>
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="VD: 0000001"
                    maxLength={30}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Ngày hóa đơn
                  </Label>
                  <Input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Mã số thuế nhà cung cấp
                  </Label>
                  <Input
                    readOnly
                    value={selectedSupplier?.taxCode ?? ""}
                    className="h-8 text-sm bg-muted"
                  />
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Bút toán Nợ 1331 / Có 331 sẽ được tự động tạo cho phần thuế GTGT
                đầu vào khi Ghi sổ.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Bottom action bar ─────────────────────────────────────────────── */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          disabled={saving}
        >
          Hủy
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={saving}
        >
          {saving ? "Đang lưu..." : "Lưu nháp"}
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu và Ghi sổ"}
        </Button>
      </div>
    </div>
  );
}

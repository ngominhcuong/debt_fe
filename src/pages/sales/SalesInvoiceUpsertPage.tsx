import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  api,
  type Item,
  type Partner,
  type Account,
  type SalesInvoiceDetailPayload,
  type SalesInvoiceFull,
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DetailRow {
  _key: string; // internal key for React rendering
  itemId: string;
  warehouseId: string;
  description: string;
  qty: string;
  unitPrice: string;
  vatRate: string;
  arAccountId: string;
  revAccountId: string;
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
    arAccountId: "",
    revAccountId: "",
  };
}

function toLocalDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SalesInvoiceUpsertPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEdit = Boolean(editId);
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  // ── Master data ──────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState<Partner[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    if (!token) return;
    api.master
      .listPartners(token, { partnerType: "CUSTOMER", isActive: true })
      .then((r) => setCustomers(r.data))
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

  // ── Header flags ─────────────────────────────────────────────────────────
  const [isDelivered, setIsDelivered] = useState(false);
  const [isInvoiced, setIsInvoiced] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"PENDING" | "IMMEDIATE">(
    "PENDING",
  );

  // ── Header form ──────────────────────────────────────────────────────────
  const today = toLocalDateStr(new Date());
  const [customerId, setCustomerId] = useState("");
  const [description, setDescription] = useState("");
  const [accountingDate, setAccountingDate] = useState(today);
  const [voucherDate, setVoucherDate] = useState(today);
  const [voucherNumber, setVoucherNumber] = useState(""); // read-only in edit mode

  // New header fields
  const [contactPerson, setContactPerson] = useState("");
  const [salesPersonName, setSalesPersonName] = useState("");
  const [reference, setReference] = useState("");
  const [paymentTermDays, setPaymentTermDays] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Auto-fill address/taxCode from selected customer
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId],
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

  // Auto-fill paymentTermDays from customer when customer changes
  useEffect(() => {
    if (selectedCustomer?.paymentTermDays != null && !isEdit) {
      setPaymentTermDays(String(selectedCustomer.paymentTermDays));
    }
  }, [selectedCustomer, isEdit]);

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
      if (prev.length === 1) return prev; // keep at least one row
      return prev.filter((r) => r._key !== key);
    });
  }

  // Auto-fill unit price and VAT when item changes
  function handleItemChange(key: string, itemId: string) {
    const item = items.find((i) => i.id === itemId);
    setRows((prev) =>
      prev.map((r) => {
        if (r._key !== key) return r;
        return {
          ...r,
          itemId,
          unitPrice: item?.salePrice ?? "0",
          vatRate: item?.vatRate ?? "10",
          arAccountId: "",
          revAccountId: item?.revenueAccountId ?? "",
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

  // ── Invoice tab fields ───────────────────────────────────────────────────
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceSeries, setInvoiceSeries] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today);

  // Auto-fill ký hiệu HĐ + số HĐ when isInvoiced is ticked on (create mode only)
  useEffect(() => {
    if (!isInvoiced || !token || isEdit) return;
    const year = new Date().getFullYear();
    if (!invoiceSeries) {
      api.invoiceSetting
        .list(token, year)
        .then((r) => {
          const active = r.data.find((s) => s.isActive);
          if (active) setInvoiceSeries(active.symbol);
        })
        .catch(() => undefined);
    }
    if (!invoiceNumber) {
      api.salesInvoice
        .nextInvoiceNumber(token)
        .then((r) => setInvoiceNumber(r.data.invoiceNumber))
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInvoiced, token]);

  // ── Delivery tab fields ──────────────────────────────────────────────────
  const [deliveryPerson, setDeliveryPerson] = useState("");
  const [receiverPerson, setReceiverPerson] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");

  // ── Edit mode: load existing data ────────────────────────────────────────
  useEffect(() => {
    if (!isEdit || !editId || !token) return;
    api.salesInvoice
      .getById(editId, token)
      .then((resp) => {
        const inv = resp.data;
        setCustomerId(inv.customer.id);
        setDescription(inv.description ?? "");
        setAccountingDate(inv.accountingDate.slice(0, 10));
        setVoucherDate(inv.voucherDate.slice(0, 10));
        setVoucherNumber(inv.voucherNumber);
        setIsDelivered(inv.isDelivered);
        setIsInvoiced(inv.isInvoiced);
        setContactPerson(inv.contactPerson ?? "");
        setSalesPersonName(inv.salesPersonName ?? "");
        setReference(inv.reference ?? "");
        setPaymentTermDays(
          inv.paymentTermDays == null ? "" : String(inv.paymentTermDays),
        );
        setDueDate(inv.dueDate ? inv.dueDate.slice(0, 10) : "");
        setInvoiceNumber(inv.invoiceNumber ?? "");
        setInvoiceSeries(inv.invoiceSeries ?? "");
        setInvoiceDate(inv.invoiceDate ? inv.invoiceDate.slice(0, 10) : today);
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
              arAccountId: d.arAccount?.id ?? "",
              revAccountId: d.revAccount?.id ?? "",
            })),
          );
        }
      })
      .catch(() => {
        toast.error("Không tải được chứng từ");
        navigate("/sales/invoices");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, editId, token]);

  // ── Submission ───────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);

  function buildPayload(isPosted: boolean) {
    const details: SalesInvoiceDetailPayload[] = rows
      .filter((r) => r.itemId)
      .map((r, i) => ({
        itemId: r.itemId,
        warehouseId: r.warehouseId || undefined,
        description: r.description || undefined,
        qty: Number.parseFloat(r.qty) || 0,
        unitPrice: Number.parseFloat(r.unitPrice) || 0,
        vatRate: Number.parseFloat(r.vatRate) || 0,
        arAccountId: r.arAccountId || undefined,
        revAccountId: r.revAccountId || undefined,
        sortOrder: i,
      }));

    const ptDays = Number.parseInt(paymentTermDays, 10);

    return {
      voucherDate,
      accountingDate,
      customerId,
      description: description || undefined,
      isPosted,
      isDelivered,
      isInvoiced,
      invoiceNumber: isInvoiced ? invoiceNumber || undefined : undefined,
      invoiceSeries: isInvoiced ? invoiceSeries || undefined : undefined,
      invoiceDate: isInvoiced ? invoiceDate || undefined : undefined,
      contactPerson: contactPerson || undefined,
      salesPersonName: salesPersonName || undefined,
      reference: reference || undefined,
      paymentTermDays: Number.isNaN(ptDays) ? undefined : ptDays,
      dueDate: dueDate || undefined,
      details,
    };
  }

  async function handleSave(isPosted: boolean) {
    if (!customerId) {
      toast.error("Vui lòng chọn khách hàng");
      return;
    }
    if (rows.filter((r) => r.itemId).length === 0) {
      toast.error("Vui lòng nhập ít nhất một dòng hàng hóa");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && editId) {
        const result = await api.salesInvoice.update(
          editId,
          buildPayload(isPosted),
          token,
        );
        toast.success(result.message ?? "Cập nhật thành công");
      } else {
        const result = await api.salesInvoice.create(
          buildPayload(isPosted),
          token,
        );
        toast.success(result.message ?? "Lưu thành công");
      }
      navigate("/sales/invoices");
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

  const arAccount131 = accounts.find((a) => a.code === "131");

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto">
      {/* ── Page title ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isEdit ? "Sửa chứng từ bán hàng" : "Chứng từ bán hàng"}
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

      {/* ── Flags & payment mode ─────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium">
                <Checkbox
                  checked={isDelivered}
                  onCheckedChange={(v) => setIsDelivered(Boolean(v))}
                />
                Kiêm phiếu xuất kho
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium">
                <Checkbox
                  checked={isInvoiced}
                  onCheckedChange={(v) => {
                    const checked = Boolean(v);
                    setIsInvoiced(checked);
                    if (!checked && !isEdit) {
                      setInvoiceSeries("");
                      setInvoiceNumber("");
                    }
                  }}
                />
                Lập kèm hóa đơn GTGT
              </label>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <RadioGroup
              value={paymentMode}
              onValueChange={(v) =>
                setPaymentMode(v as "PENDING" | "IMMEDIATE")
              }
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="PENDING" id="pay-pending" />
                <Label htmlFor="pay-pending" className="cursor-pointer">
                  Chưa thu tiền
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="IMMEDIATE" id="pay-immediate" />
                <Label htmlFor="pay-immediate" className="cursor-pointer">
                  Thu tiền ngay
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="debit-note">
        <TabsList className="mb-0">
          <TabsTrigger value="debit-note">Chứng từ ghi nợ</TabsTrigger>
          <TabsTrigger value="delivery" disabled={!isDelivered}>
            Phiếu xuất kho
          </TabsTrigger>
          <TabsTrigger value="invoice" disabled={!isInvoiced}>
            Hóa đơn GTGT
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Document form + line items */}
        <TabsContent value="debit-note" className="mt-0">
          <Card className="rounded-tl-none">
            <CardContent className="pt-4">
              {/* Header form */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-x-8 gap-y-0">
                {/* Left column — customer & transaction info (3-col grid = 4 rows) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                  {/* Row 1: Mã KH | Tên KH | MST/CCCD */}
                  <div className="space-y-1">
                    <Label htmlFor="customer">
                      Khách hàng <span className="text-destructive">*</span>
                    </Label>
                    <Select value={customerId} onValueChange={setCustomerId}>
                      <SelectTrigger id="customer">
                        <SelectValue placeholder="Chọn khách hàng..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.code} — {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Tên khách hàng</Label>
                    <Input
                      readOnly
                      value={selectedCustomer?.name ?? ""}
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Mã số thuế / CCCD</Label>
                    <Input
                      readOnly
                      value={selectedCustomer?.taxCode ?? ""}
                      placeholder="Tự động điền"
                      className="bg-muted"
                    />
                  </div>

                  {/* Row 2: Địa chỉ (span-2) | Người liên hệ */}
                  <div className="space-y-1 md:col-span-2">
                    <Label>Địa chỉ</Label>
                    <Input
                      readOnly
                      value={selectedCustomer?.address ?? ""}
                      placeholder="Địa chỉ sẽ tự động điền"
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contactPerson">Người liên hệ</Label>
                    <Input
                      id="contactPerson"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Họ tên người liên hệ..."
                      maxLength={120}
                    />
                  </div>

                  {/* Row 3: Nhân viên | Tham chiếu | Số ngày nợ */}
                  <div className="space-y-1">
                    <Label htmlFor="salesPersonName">Nhân viên bán hàng</Label>
                    <Input
                      id="salesPersonName"
                      value={salesPersonName}
                      onChange={(e) => setSalesPersonName(e.target.value)}
                      placeholder="Tên nhân viên..."
                      maxLength={120}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="paymentTermDays">Số ngày được nợ</Label>
                    <Input
                      id="paymentTermDays"
                      type="number"
                      min="0"
                      value={paymentTermDays}
                      onChange={(e) => setPaymentTermDays(e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  {/* Row 4: Diễn giải (span-2) | Hạn thanh toán */}
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="description">Diễn giải</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Nội dung chứng từ..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dueDate">Hạn thanh toán</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Right column — dates & voucher number */}
                <div className="flex flex-col gap-2 min-w-[200px] mt-3 lg:mt-0 lg:pl-6 lg:border-l">
                  <div className="space-y-1">
                    <Label htmlFor="accountingDate">Ngày hạch toán</Label>
                    <Input
                      id="accountingDate"
                      type="date"
                      value={accountingDate}
                      onChange={(e) => setAccountingDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="voucherDate">Ngày chứng từ</Label>
                    <Input
                      id="voucherDate"
                      type="date"
                      value={voucherDate}
                      onChange={(e) => setVoucherDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Số chứng từ</Label>
                    <Input
                      readOnly
                      value={isEdit ? voucherNumber : "Tự động tạo"}
                      className="bg-muted text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted border-b">
                      <th className="px-2 py-2 text-left font-medium w-[180px]">
                        Mã hàng
                      </th>
                      <th className="px-2 py-2 text-left font-medium w-[70px]">
                        ĐVT
                      </th>
                      <th className="px-2 py-2 text-left font-medium w-[100px]">
                        Kho
                      </th>
                      <th className="px-2 py-2 text-left font-medium">
                        Diễn giải
                      </th>
                      <th className="px-2 py-2 text-left font-medium w-[130px]">
                        TK Nợ (131)
                      </th>
                      <th className="px-2 py-2 text-left font-medium w-[130px]">
                        TK Có (511)
                      </th>
                      <th className="px-2 py-2 text-right font-medium w-[90px]">
                        Số lượng
                      </th>
                      <th className="px-2 py-2 text-right font-medium w-[110px]">
                        Đơn giá
                      </th>
                      <th className="px-2 py-2 text-right font-medium w-[70px]">
                        VAT%
                      </th>
                      <th className="px-2 py-2 text-right font-medium w-[110px]">
                        Thành tiền
                      </th>
                      <th className="px-2 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const lineQty = Number.parseFloat(row.qty) || 0;
                      const linePrice = Number.parseFloat(row.unitPrice) || 0;
                      const lineAmount = lineQty * linePrice;
                      const selectedItem = items.find(
                        (i) => i.id === row.itemId,
                      );

                      return (
                        <tr
                          key={row._key}
                          className="border-b hover:bg-muted/30"
                        >
                          {/* Item */}
                          <td className="p-1">
                            <Select
                              value={row.itemId}
                              onValueChange={(v) =>
                                handleItemChange(row._key, v)
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
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

                          {/* ĐVT */}
                          <td className="p-1">
                            <Input
                              readOnly
                              className="h-8 text-xs bg-muted text-center"
                              value={selectedItem?.unit ?? ""}
                            />
                          </td>

                          {/* Warehouse placeholder */}
                          <td className="p-1">
                            <Input
                              className="h-8 text-xs"
                              placeholder="Kho..."
                              value={row.warehouseId}
                              onChange={(e) =>
                                updateRow(
                                  row._key,
                                  "warehouseId",
                                  e.target.value,
                                )
                              }
                              disabled={!isDelivered}
                            />
                          </td>

                          {/* Description */}
                          <td className="p-1">
                            <Input
                              className="h-8 text-xs"
                              value={row.description}
                              onChange={(e) =>
                                updateRow(
                                  row._key,
                                  "description",
                                  e.target.value,
                                )
                              }
                            />
                          </td>

                          {/* AR account (131) */}
                          <td className="p-1">
                            <Select
                              value={
                                row.arAccountId || (arAccount131?.id ?? "")
                              }
                              onValueChange={(v) =>
                                updateRow(row._key, "arAccountId", v)
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="131" />
                              </SelectTrigger>
                              <SelectContent>
                                {accounts
                                  .filter((a) => a.accountType === "ASSET")
                                  .map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                      {a.code} — {a.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </td>

                          {/* Rev account (511) */}
                          <td className="p-1">
                            <Select
                              value={row.revAccountId}
                              onValueChange={(v) =>
                                updateRow(row._key, "revAccountId", v)
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="511" />
                              </SelectTrigger>
                              <SelectContent>
                                {accounts
                                  .filter((a) => a.accountType === "REVENUE")
                                  .map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                      {a.code} — {a.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </td>

                          {/* Qty */}
                          <td className="p-1">
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              className="h-8 text-xs text-right"
                              value={row.qty}
                              onChange={(e) =>
                                updateRow(row._key, "qty", e.target.value)
                              }
                            />
                          </td>

                          {/* Unit price */}
                          <td className="p-1">
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              className="h-8 text-xs text-right"
                              value={row.unitPrice}
                              onChange={(e) =>
                                updateRow(row._key, "unitPrice", e.target.value)
                              }
                            />
                          </td>

                          {/* VAT rate — auto from item */}
                          <td className="p-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              className={cn(
                                "h-8 text-xs text-right",
                                row.itemId && "bg-muted",
                              )}
                              value={row.vatRate}
                              readOnly={!!row.itemId}
                              onChange={(e) =>
                                !row.itemId &&
                                updateRow(row._key, "vatRate", e.target.value)
                              }
                            />
                          </td>

                          {/* Line amount (read-only) */}
                          <td className="p-1 text-right tabular-nums text-sm pr-2">
                            {fmtCurrency(lineAmount)}
                          </td>

                          {/* Remove row */}
                          <td className="p-1 text-center">
                            <button
                              type="button"
                              className="text-destructive hover:text-destructive/80 text-lg leading-none px-1"
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

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={addRow}
              >
                + Thêm dòng
              </Button>

              {/* Footer totals */}
              <div className="mt-4 flex justify-end">
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm min-w-[280px]">
                  <span className="text-muted-foreground">Tổng tiền hàng:</span>
                  <span className="text-right tabular-nums font-medium">
                    {fmtCurrency(totalAmount)}
                  </span>

                  <span className="text-muted-foreground">Thuế GTGT:</span>
                  <span className="text-right tabular-nums font-medium">
                    {fmtCurrency(vatAmount)}
                  </span>

                  <Separator className="col-span-2 my-1" />

                  <span className="font-semibold">Tổng thanh toán:</span>
                  <span className="text-right tabular-nums font-bold text-base">
                    {fmtCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Delivery info */}
        <TabsContent value="delivery" className="mt-0">
          <Card
            className={cn(
              "rounded-tl-none",
              !isDelivered && "opacity-50 pointer-events-none",
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Thông tin phiếu xuất kho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div className="space-y-1">
                  <Label htmlFor="deliveryPerson">Người giao hàng</Label>
                  <Input
                    id="deliveryPerson"
                    value={deliveryPerson}
                    onChange={(e) => setDeliveryPerson(e.target.value)}
                    placeholder="Họ tên người giao..."
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="receiverPerson">Người nhận hàng</Label>
                  <Input
                    id="receiverPerson"
                    value={receiverPerson}
                    onChange={(e) => setReceiverPerson(e.target.value)}
                    placeholder="Họ tên người nhận..."
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="deliveryNote">Ghi chú xuất kho</Label>
                  <Textarea
                    id="deliveryNote"
                    rows={3}
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    placeholder="Địa điểm giao, điều kiện vận chuyển..."
                  />
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Bút toán Nợ 632 / Có 156 sẽ được tự động tạo khi Ghi sổ nếu hàng
                hóa có khai báo giá vốn.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Invoice info */}
        <TabsContent value="invoice" className="mt-0">
          <Card
            className={cn(
              "rounded-tl-none",
              !isInvoiced && "opacity-50 pointer-events-none",
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Thông tin hóa đơn GTGT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
                <div className="space-y-1">
                  <Label htmlFor="invoiceSeries">Ký hiệu hóa đơn</Label>
                  <Input
                    id="invoiceSeries"
                    value={invoiceSeries}
                    onChange={(e) => setInvoiceSeries(e.target.value)}
                    placeholder="VD: 1C25TTT"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="invoiceNumber">Số hóa đơn</Label>
                  <Input
                    id="invoiceNumber"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="VD: 0000001"
                    maxLength={30}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="invoiceDate">Ngày hóa đơn</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Bút toán Nợ 131 / Có 3331 sẽ được tự động tạo cho phần thuế GTGT
                đầu ra khi Ghi sổ.
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

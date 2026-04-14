import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type SalesInvoiceFull } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// ── Cấu hình thông tin đơn vị bán (sửa theo thực tế) ──────────────────────────
const SELLER = {
  name: "CÔNG TY TNHH MWCONNECT VIỆT NAM",
  taxCode: "2301305030",
  address: "Xưởng A1, Lô CN17A-3, Khu công nghiệp Quế Võ III, Bắc Ninh",
  bankAccount: "",
  representative: "GIÁM ĐỐC",
  signerName: "Nguyễn Văn A",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtN(val: string | number) {
  const n = typeof val === "string" ? Number.parseFloat(val) : val;
  return Number.isNaN(n) ? "0" : new Intl.NumberFormat("vi-VN").format(n);
}

function fmtDateParts(iso: string | null): {
  day: string;
  month: string;
  year: string;
} {
  if (!iso) return { day: "___", month: "___", year: "____" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()))
    return { day: "___", month: "___", year: "____" };
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: String(d.getMonth() + 1).padStart(2, "0"),
    year: String(d.getFullYear()),
  };
}

// Number to Vietnamese words
function numberToWords(amount: number): string {
  const n = Math.round(amount);
  if (n === 0) return "Không đồng chẵn";

  const ones = [
    "",
    "một",
    "hai",
    "ba",
    "bốn",
    "năm",
    "sáu",
    "bảy",
    "tám",
    "chín",
  ];

  function readGroup(g: number): string {
    const h = Math.floor(g / 100);
    const rem = g % 100;
    const t = Math.floor(rem / 10);
    const u = rem % 10;
    let res = "";
    if (h > 0) res = `${ones[h]} trăm`;
    if (t === 0 && u === 0) return res;
    if (res) res += " ";
    if (t === 0) {
      res += `linh ${ones[u]}`;
    } else if (t === 1) {
      res += "mười";
      if (u === 5) res += " lăm";
      else if (u > 0) res += ` ${ones[u]}`;
    } else {
      res += `${ones[t]} mươi`;
      if (u === 1) res += " mốt";
      else if (u === 5) res += " lăm";
      else if (u > 0) res += ` ${ones[u]}`;
    }
    return res;
  }

  const parts: string[] = [];
  const ty = Math.floor(n / 1_000_000_000);
  const trieu = Math.floor((n % 1_000_000_000) / 1_000_000);
  const nghin = Math.floor((n % 1_000_000) / 1_000);
  const don = n % 1_000;

  if (ty > 0) parts.push(`${readGroup(ty)} tỷ`);
  if (trieu > 0) parts.push(`${readGroup(trieu)} triệu`);
  if (nghin > 0) parts.push(`${readGroup(nghin)} nghìn`);
  if (don > 0) parts.push(readGroup(don));

  const result = parts.join(" ");
  return `${result.charAt(0).toUpperCase()}${result.slice(1)} đồng chẵn`;
}

// ── VAT Invoice template ───────────────────────────────────────────────────────

function VATInvoice({ invoice }: Readonly<{ invoice: SalesInvoiceFull }>) {
  const date = fmtDateParts(invoice.invoiceDate ?? invoice.accountingDate);
  const totalAmt = Number.parseFloat(invoice.totalAmount);
  const totalVat = Number.parseFloat(invoice.vatAmount);
  const grandTotal = Number.parseFloat(invoice.grandTotal);

  // Primary VAT rate (if all lines share one rate, show it in the summary row)
  const vatRates = [
    ...new Set(invoice.details.map((d) => Number.parseFloat(d.vatRate))),
  ];
  const primaryVatRate = vatRates.length === 1 ? vatRates[0] : null;

  const BLUE = "#1a56a0";
  const BORDER = "1px solid #b8c4d8";

  const TH: React.CSSProperties = {
    border: BORDER,
    padding: "1.5mm 2mm",
    textAlign: "center",
    background: BLUE,
    color: "white",
    fontWeight: "bold",
    fontSize: "8pt",
    lineHeight: "1.25",
    verticalAlign: "bottom",
  };
  const TD: React.CSSProperties = {
    border: BORDER,
    padding: "1.5mm 2mm",
    fontSize: "9pt",
    lineHeight: "1.3",
    verticalAlign: "middle",
  };

  const STRIPE =
    "repeating-linear-gradient(45deg,#1a56a0 0,#1a56a0 4px,#4a7fc1 4px,#4a7fc1 8px,#1a56a0 8px)";

  // Pad to at least 4 data rows so table body is never too thin
  const PAD_TO = 4;
  const padCount = Math.max(0, PAD_TO - invoice.details.length);

  return (
    <div
      id="invoice-template"
      style={{
        width: "210mm",
        height: "297mm",
        overflow: "hidden",
        background: "white",
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: "9.5pt",
        color: "#111",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Top stripe bar ── */}
      <div style={{ height: "5mm", flexShrink: 0, background: STRIPE }} />

      {/* ── Body ── */}
      <div
        style={{
          flex: 1,
          padding: "4mm 10mm 3mm",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ── Title row ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            marginBottom: "3mm",
          }}
        >
          <div style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                fontSize: "18pt",
                fontWeight: "bold",
                color: BLUE,
                lineHeight: "1.1",
              }}
            >
              HÓA ĐƠN GIÁ TRỊ GIA TĂNG
            </div>
            <div
              style={{
                fontSize: "11pt",
                fontStyle: "italic",
                color: BLUE,
                marginBottom: "1.5mm",
              }}
            >
              (VAT INVOICE)
            </div>
            <div style={{ fontSize: "10pt" }}>
              Ngày <em>(date)</em> <strong>{date.day}</strong> tháng{" "}
              <em>(month)</em> <strong>{date.month}</strong> năm <em>(year)</em>{" "}
              <strong>{date.year}</strong>
            </div>
          </div>
          <div
            style={{ textAlign: "right", fontSize: "8.5pt", minWidth: "52mm" }}
          >
            <div style={{ marginBottom: "1mm" }}>Mẫu số</div>
            <div style={{ marginBottom: "1mm" }}>
              Ký hiệu <em>(Serial No.):</em>{" "}
              <strong style={{ color: BLUE }}>
                {invoice.invoiceSeries ?? "—"}
              </strong>
            </div>
            <div>
              Số <em>(Invoice No.):</em>{" "}
              <strong style={{ color: BLUE }}>
                {invoice.invoiceNumber ?? "—"}
              </strong>
            </div>
          </div>
        </div>

        {/* ── Tax authority code ── */}
        <div style={{ marginBottom: "2mm", fontSize: "8.5pt" }}>
          <strong>Mã của Cơ quan thuế:</strong>{" "}
          <em style={{ color: "#666" }}>(Không điền)</em>
        </div>

        {/* ── Seller box ── */}
        <div
          style={{
            border: `2px solid ${BLUE}`,
            padding: "2mm 3mm",
            marginBottom: "2mm",
            lineHeight: "1.5",
          }}
        >
          <div>
            <strong>
              Đơn vị bán <em>(Seller):</em>
            </strong>{" "}
            {SELLER.name}
          </div>
          <div>
            <strong>
              MST <em>(Tax Code):</em>
            </strong>{" "}
            {SELLER.taxCode}
          </div>
          <div>
            <strong>
              Địa chỉ <em>(Address):</em>
            </strong>{" "}
            {SELLER.address}
          </div>
          <div>
            <strong>
              STK <em>(Account No.):</em>
            </strong>{" "}
            {SELLER.bankAccount || "—"}
          </div>
        </div>

        {/* ── Buyer section ── */}
        <div style={{ marginBottom: "2mm", lineHeight: "1.55" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>
                Đơn vị mua <em>(Buyer):</em>
              </strong>{" "}
              {invoice.customer.name}
            </div>
            <div style={{ whiteSpace: "nowrap", fontSize: "9pt" }}>
              Ngày <strong>{date.day}</strong> tháng{" "}
              <strong>{date.month}</strong> năm <strong>{date.year}</strong>
            </div>
          </div>
          <div>
            <strong>
              MST <em>(Tax Code):</em>
            </strong>{" "}
            {invoice.customer.taxCode ?? "—"}
          </div>
          <div>
            <strong>
              Địa chỉ <em>(Address):</em>
            </strong>{" "}
            {invoice.customer.address ?? "—"}
          </div>
          <div style={{ display: "flex", gap: "8mm" }}>
            <div>
              <strong>
                HTTT <em>(Account No.):</em>
              </strong>
            </div>
            <div>
              <strong>
                STK <em>(Account No.):</em>
              </strong>
            </div>
          </div>
        </div>

        {/* ── Line items table ── */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "2.5mm",
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: "8mm" }} />
            <col />
            <col style={{ width: "12mm" }} />
            <col style={{ width: "14mm" }} />
            <col style={{ width: "28mm" }} />
            <col style={{ width: "28mm" }} />
            <col style={{ width: "14mm" }} />
            <col style={{ width: "26mm" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={TH}>
                STT
                <br />
                <em style={{ fontWeight: "normal", fontSize: "7pt" }}>(No.)</em>
              </th>
              <th style={TH}>
                Tên hàng hóa, dịch vụ
                <br />
                <em style={{ fontWeight: "normal", fontSize: "7pt" }}>
                  (Description)
                </em>
              </th>
              <th style={TH}>
                ĐVT
                <br />
                <em style={{ fontWeight: "normal", fontSize: "7pt" }}>
                  (Unit)
                </em>
              </th>
              <th style={TH}>
                SL
                <br />
                <em style={{ fontWeight: "normal", fontSize: "7pt" }}>
                  (Quantity)
                </em>
              </th>
              <th style={TH}>
                Đơn giá
                <br />
                <em style={{ fontWeight: "normal", fontSize: "7pt" }}>
                  (Unit Price)
                </em>
              </th>
              <th style={TH}>
                Thành tiền
                <br />
                <em style={{ fontWeight: "normal", fontSize: "7pt" }}>
                  (Amount)
                </em>
              </th>
              <th style={TH}>
                Thuế suất
                <br />
                <em style={{ fontWeight: "normal", fontSize: "7pt" }}>
                  (Tax Rate)
                </em>
              </th>
              <th style={TH}>
                Tiền thuế
                <br />
                <em style={{ fontWeight: "normal", fontSize: "7pt" }}>
                  (Tax amount)
                </em>
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.details.map((d, i) => {
              const qty = Number.parseFloat(d.qty);
              const unitPrice = Number.parseFloat(d.unitPrice);
              const lineAmt = Number.parseFloat(d.amount);
              const vatRate = Number.parseFloat(d.vatRate);
              const lineVat = lineAmt * (vatRate / 100);
              return (
                <tr
                  key={d.id}
                  style={{ background: i % 2 === 0 ? "#f2f6ff" : "white" }}
                >
                  <td style={{ ...TD, textAlign: "center" }}>{i + 1}</td>
                  <td style={TD}>
                    {d.item.name}
                    {d.description && (
                      <div
                        style={{
                          fontSize: "8pt",
                          color: "#555",
                          fontStyle: "italic",
                        }}
                      >
                        {d.description}
                      </div>
                    )}
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>{d.item.unit}</td>
                  <td style={{ ...TD, textAlign: "right" }}>
                    {qty.toLocaleString("vi-VN")}
                  </td>
                  <td style={{ ...TD, textAlign: "right" }}>
                    {fmtN(unitPrice)}
                  </td>
                  <td style={{ ...TD, textAlign: "right", fontWeight: "bold" }}>
                    {fmtN(lineAmt)}
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>{vatRate} %</td>
                  <td style={{ ...TD, textAlign: "right" }}>{fmtN(lineVat)}</td>
                </tr>
              );
            })}
            {Array.from({ length: padCount }).map((_, i) => (
              <tr key={`pad-${i}`}>
                {Array.from({ length: 8 }).map((__, j) => (
                  <td key={j} style={{ ...TD, height: "6mm" }}>
                    &nbsp;
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Totals ── */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "2mm",
            fontSize: "9.5pt",
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "1mm 2mm", fontWeight: "bold" }}>
                Cộng tiền hàng:
              </td>
              <td
                style={{
                  padding: "1mm 2mm",
                  textAlign: "right",
                  fontWeight: "bold",
                  width: "42mm",
                }}
              >
                {fmtN(totalAmt)} VNĐ
              </td>
            </tr>
            <tr>
              <td style={{ padding: "1mm 2mm" }}>Tổng tiền thuế GTGT:</td>
              <td style={{ padding: "1mm 2mm", textAlign: "right" }}>
                {primaryVatRate !== null ? `${primaryVatRate} %` : "—"}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "1mm 2mm", fontStyle: "italic" }}>
                Total amount of VAT{" "}
                <span style={{ fontStyle: "normal" }}>(amount):</span>
              </td>
              <td
                style={{
                  padding: "1mm 2mm",
                  textAlign: "right",
                  fontWeight: "bold",
                }}
              >
                {fmtN(totalVat)} VNĐ
              </td>
            </tr>
            <tr style={{ borderTop: "2px solid #222" }}>
              <td
                style={{
                  padding: "1.5mm 2mm",
                  fontSize: "11pt",
                  fontWeight: "bold",
                }}
              >
                Tổng cộng thanh toán:{" "}
                <strong style={{ fontSize: "12pt" }}>{fmtN(grandTotal)}</strong>{" "}
                VNĐ
              </td>
              <td />
            </tr>
          </tbody>
        </table>

        {/* ── Amount in words ── */}
        <div
          style={{ fontStyle: "italic", fontSize: "9pt", marginBottom: "4mm" }}
        >
          (Bằng chữ: {numberToWords(grandTotal)})
        </div>

        {/* ── Signatures ── */}
        <table style={{ width: "100%", borderCollapse: "collapse", flex: 1 }}>
          <tbody>
            <tr>
              <td
                style={{
                  width: "50%",
                  textAlign: "center",
                  verticalAlign: "top",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "10pt" }}>
                  Người mua hàng
                </div>
                <div
                  style={{
                    fontStyle: "italic",
                    fontSize: "8.5pt",
                    color: "#555",
                  }}
                >
                  Ký, ghi rõ họ tên
                </div>
                <div style={{ height: "16mm" }} />
              </td>
              <td
                style={{
                  width: "50%",
                  textAlign: "center",
                  verticalAlign: "top",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "10pt" }}>
                  Người bán hàng{" "}
                  <em style={{ fontWeight: "normal" }}>(Seller)</em>
                </div>
                <div
                  style={{
                    fontStyle: "italic",
                    fontSize: "8.5pt",
                    color: "#555",
                  }}
                >
                  (Signed by):
                </div>
                <div style={{ fontWeight: "bold", marginTop: "1mm" }}>
                  {SELLER.representative}{" "}
                  <em style={{ fontWeight: "normal" }}>(Director)</em>
                </div>
                <div style={{ fontWeight: "bold", fontSize: "9pt" }}>
                  {SELLER.name}
                </div>
                <div style={{ height: "12mm" }} />
                <div style={{ fontWeight: "bold" }}>{SELLER.signerName}</div>
                <div style={{ fontStyle: "italic", fontSize: "8.5pt" }}>
                  {SELLER.representative} <em>(Director)</em>
                </div>
                <div
                  style={{
                    fontStyle: "italic",
                    fontSize: "8pt",
                    color: "#555",
                  }}
                >
                  Ký, đóng dấu, ghi rõ họ tên, tầng
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Footer note ── */}
        <div
          style={{
            borderTop: "1px solid #bbb",
            paddingTop: "2mm",
            textAlign: "center",
            fontSize: "8pt",
            color: "#444",
          }}
        >
          <div>Cần kiểm tra đối chiếu khi lập, giao, nhận hóa đơn.</div>
          <div style={{ fontStyle: "italic" }}>
            Please check again while issuing, delivering and receiving the
            invoice.
          </div>
        </div>
      </div>

      {/* ── Bottom stripe bar ── */}
      <div style={{ height: "5mm", flexShrink: 0, background: STRIPE }} />
    </div>
  );
}

// ── Page wrapper ───────────────────────────────────────────────────────────────

export default function InvoicePrintPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["sales-invoice-print", id, token],
    queryFn: () =>
      api.salesInvoice.getById(id ?? "", token).then((r) => r.data),
    enabled: !!token && !!id,
  });

  return (
    <>
      {/* ── Action toolbar (hidden on print) ── */}
      <div className="no-print flex items-center gap-2 px-4 py-2 border-b bg-card shadow-sm sticky top-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs h-8"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={14} /> Quay lại
        </Button>
        <div className="flex-1" />
        {data && (
          <>
            <span className="text-xs text-muted-foreground hidden sm:block">
              {data.invoiceNumber
                ? `Số HĐ: ${data.invoiceNumber}`
                : data.voucherNumber}
              {" — "}
              {data.customer.name}
            </span>
            <Button
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => window.print()}
            >
              <Printer size={14} /> In / Tải hóa đơn
            </Button>
          </>
        )}
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center h-[70vh]">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : isError || !data ? (
        <div className="flex flex-col items-center justify-center h-[70vh] gap-3 text-destructive">
          <AlertCircle size={28} />
          <p className="text-sm">Không thể tải hóa đơn.</p>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </div>
      ) : (
        <div className="no-print-bg min-h-screen bg-gray-200 py-6 flex justify-center">
          <VATInvoice invoice={data} />
        </div>
      )}

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .no-print-bg {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          body, html { margin: 0 !important; padding: 0 !important; background: white !important; }
          @page { size: A4 portrait; margin: 0; }
          #invoice-template { box-shadow: none !important; }
        }
      `}</style>
    </>
  );
}

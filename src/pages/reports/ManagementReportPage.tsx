import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Printer,
  Download,
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
import { api, type ManagementReportResult } from "@/lib/api";
import { openPrintPreviewWindow } from "@/lib/print-preview";
import { useAuth } from "@/contexts/AuthContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtVND(val: number): string {
  if (val === 0) return "—";
  return new Intl.NumberFormat("vi-VN").format(Math.round(val));
}

function fmtBalance(val: number) {
  if (val < 0)
    return <span className="text-destructive">({fmtVND(Math.abs(val))})</span>;
  return <>{fmtVND(val)}</>;
}

const COMPANY = {
  name: "CÔNG TY TNHH MWCONNECT VIỆT NAM",
  address: "Xưởng A1, Lô CN17A-3, Khu công nghiệp Quế Võ III, Bắc Ninh",
};

const ACCOUNT_LABELS: Record<string, string> = {
  "131": "Tài khoản 131 — Phải thu khách hàng",
  "331": "Tài khoản 331 — Phải trả nhà cung cấp",
};

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtAmt(val: number): string {
  if (val === 0) return "—";
  return new Intl.NumberFormat("vi-VN").format(Math.round(Math.abs(val)));
}

function fmtBalAmt(val: number): string {
  if (val === 0) return "0";
  const s = new Intl.NumberFormat("vi-VN").format(Math.round(Math.abs(val)));
  return val < 0 ? `(${s})` : s;
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function buildManagementHtml(
  result: ManagementReportResult,
  accountCode: string,
  dateFrom?: string,
  dateTo?: string,
): string {
  const periodLabel = `Từ ngày ${dateFrom ? fmtDate(dateFrom) : "đầu kỳ"} đến ngày ${dateTo ? fmtDate(dateTo) : "hiện tại"}`;
  const accountLabel = ACCOUNT_LABELS[accountCode] ?? `TK ${accountCode}`;
  const today = fmtDate(new Date().toISOString());

  const rows = result.rows
    .map(
      (row, i) => `
    <tr class="${i % 2 === 1 ? "even" : ""}">
      <td class="center">${i + 1}</td>
      <td class="mono">${escapeHtml(row.partnerCode)}</td>
      <td>${escapeHtml(row.partnerName)}</td>
      <td class="center">${escapeHtml(row.taxCode ?? "—")}</td>
      <td class="right">${escapeHtml(fmtBalAmt(row.openingBalance))}</td>
      <td class="right">${escapeHtml(fmtAmt(row.periodDebit))}</td>
      <td class="right">${escapeHtml(fmtAmt(row.periodCredit))}</td>
      <td class="right bold">${escapeHtml(fmtBalAmt(row.closingBalance))}</td>
    </tr>`,
    )
    .join("");

  const t = result.totals;
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Bảng tổng hợp công nợ — ${escapeHtml(accountLabel)}</title>
  <style>
    @page { size: A4 landscape; margin: 18mm 20mm 16mm 20mm; }
    * { box-sizing: border-box; }
    body { font-family: "Times New Roman", serif; font-size: 13px; color: #111; margin: 0; padding: 0; }
    @media screen {
      body { background: #e8e8e8; }
      .page-wrap { background: #fff; max-width: 297mm; margin: 20px auto; padding: 18mm 20mm 16mm 20mm; box-shadow: 0 2px 12px rgba(0,0,0,.18); }
    }
    @media print {
      body { background: none; }
      .page-wrap { max-width: none; margin: 0; padding: 0; box-shadow: none; }
    }

    .topbar { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    .topbar td { vertical-align: top; padding: 0; }
    .topbar td:first-child { width: 55%; }
    .topbar td:last-child  { width: 45%; text-align: right; }
    .company-name { font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; }
    .company-sub  { font-size: 12px; margin-bottom: 2px; }
    .date-note    { font-size: 12px; }

    .title { text-align: center; margin: 4px 0 14px; }
    .title h1   { margin: 0 0 4px; font-size: 20px; letter-spacing: 0.5px; text-transform: uppercase; }
    .title .sub    { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
    .title .period { font-size: 12px; font-style: italic; }

    table.rpt { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 14px; }
    table.rpt th, table.rpt td { border: 1px solid #555; padding: 5px 7px; font-size: 12px; vertical-align: middle; }
    table.rpt thead th { background: #dce8f6; text-align: center; font-weight: 700; }
    table.rpt tbody tr.even { background: #f7fafd; }
    table.rpt .sum-row td { font-weight: 700; background: #eef4fb; border-top: 2px solid #555; }
    table.rpt .center { text-align: center; }
    table.rpt .right  { text-align: right; white-space: nowrap; }
    table.rpt .mono   { font-family: monospace; }
    table.rpt .bold   { font-weight: 700; }

    .signatures { width: 100%; border-collapse: collapse; margin-top: 14px; }
    .signatures td { width: 33.33%; text-align: center; vertical-align: top;
                     font-size: 13px; font-weight: 700; padding: 0 8px; }
    .signatures .hint  { display: block; font-style: italic; font-weight: 400; font-size: 12px; margin-top: 2px; }
    .signatures .space { display: block; height: 60px; }
  </style>
</head>
<body>
  <div class="page-wrap">
  <table class="topbar">
    <tr>
      <td>
        <div class="company-name">${escapeHtml(COMPANY.name)}</div>
        <div class="company-sub">${escapeHtml(COMPANY.address)}</div>
      </td>
      <td>
        <div class="date-note">
          <b>Bảng tổng hợp công nợ</b><br />
          <em style="font-weight:400">Ngày in: ${escapeHtml(today)}</em>
        </div>
      </td>
    </tr>
  </table>

  <div class="title">
    <h1>Bảng Tổng Hợp Công Nợ</h1>
    <div class="sub">${escapeHtml(accountLabel)}</div>
    <div class="period">${escapeHtml(periodLabel)}</div>
  </div>

  <table class="rpt">
    <colgroup>
      <col style="width:4%" />
      <col style="width:10%" />
      <col style="width:30%" />
      <col style="width:14%" />
      <col style="width:11%" />
      <col style="width:10%" />
      <col style="width:10%" />
      <col style="width:11%" />
    </colgroup>
    <thead><tr>
      <th>STT</th>
      <th>Mã ĐT</th>
      <th>Tên đối tác</th>
      <th>Mã số thuế</th>
      <th>Dư đầu kỳ</th>
      <th>PS Nợ</th>
      <th>PS Có</th>
      <th>Dư cuối kỳ</th>
    </tr></thead>
    <tbody>
      ${rows || '<tr><td colspan="8" class="center" style="padding:10px">Không có dữ liệu</td></tr>'}
      ${
        result.rows.length > 0
          ? `
      <tr class="sum-row">
        <td colspan="4" class="right">Tổng cộng</td>
        <td class="right">${escapeHtml(fmtBalAmt(t.openingBalance))}</td>
        <td class="right">${escapeHtml(fmtAmt(t.periodDebit))}</td>
        <td class="right">${escapeHtml(fmtAmt(t.periodCredit))}</td>
        <td class="right">${escapeHtml(fmtBalAmt(t.closingBalance))}</td>
      </tr>`
          : ""
      }
    </tbody>
  </table>
  ${result.total > result.rows.length ? `<p style="font-size:12px;font-style:italic">* Hiển thị ${result.rows.length} / ${result.total} đối tác (trang ${result.page})</p>` : ""}

  <table class="signatures">
    <tr>
      <td>NGƯỜI LẬP BẢNG<span class="hint">(Ký, họ tên)</span></td>
      <td>KẾ TOÁN TRƯỞNG<span class="hint">(Ký, họ tên)</span></td>
      <td>NGƯỜI ĐẠI DIỆN THEO PHÁP LUẬT<span class="hint">(Ký, họ tên, đóng dấu)</span></td>
    </tr>
    <tr>
      <td><span class="space"></span></td>
      <td><span class="space"></span></td>
      <td><span class="space"></span></td>
    </tr>
  </table>
  </div>
</body>
</html>`;
}

function openManagementPrint(
  result: ManagementReportResult,
  accountCode: string,
  dateFrom?: string,
  dateTo?: string,
) {
  const html = buildManagementHtml(result, accountCode, dateFrom, dateTo);
  openPrintPreviewWindow(html, `Bao cao cong no ${accountCode}`);
}

function downloadManagementReport(
  result: ManagementReportResult,
  accountCode: string,
  dateFrom?: string,
  dateTo?: string,
) {
  openManagementPrint(result, accountCode, dateFrom, dateTo);
}

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function ManagementReportPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  const [accountCode, setAccountCode] = useState("131");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [searched, setSearched] = useState(false);

  const reportQuery = useQuery({
    queryKey: [
      "management-report",
      accountCode,
      dateFrom,
      dateTo,
      q,
      page,
      token,
    ],
    queryFn: () =>
      api.report
        .getManagement(
          {
            accountCode,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            q: q || undefined,
            page,
            limit: PAGE_SIZE,
          },
          token,
        )
        .then((r) => r.data),
    enabled: searched && !!token,
    staleTime: 30_000,
  });

  const result = reportQuery.data;
  const totalPages = result ? Math.ceil(result.total / result.limit) : 1;

  function handleSearch() {
    setPage(1);
    setSearched(true);
    reportQuery.refetch();
  }

  return (
    <>
      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div>
          <Label className="text-xs mb-1 block">Loại công nợ</Label>
          <Select value={accountCode} onValueChange={setAccountCode}>
            <SelectTrigger className="h-8 text-sm w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="131" className="text-xs">
                131 — Phải thu KH
              </SelectItem>
              <SelectItem value="331" className="text-xs">
                331 — Phải trả NCC
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs mb-1 block">Từ ngày</Label>
          <Input
            type="date"
            className="h-8 text-sm w-36"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Đến ngày</Label>
          <Input
            type="date"
            className="h-8 text-sm w-36"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <div className="flex-1 min-w-[180px]">
          <Label className="text-xs mb-1 block">Tìm đối tác</Label>
          <Input
            className="h-8 text-sm"
            placeholder="Mã hoặc tên đối tác..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>

        <Button size="sm" className="h-8 gap-1.5" onClick={handleSearch}>
          {reportQuery.isFetching ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Search size={13} />
          )}
          Tra cứu
        </Button>

        {result && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
              onClick={() =>
                openManagementPrint(
                  result,
                  accountCode,
                  dateFrom || undefined,
                  dateTo || undefined,
                )
              }
            >
              <Printer size={13} /> In báo cáo
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
              onClick={() =>
                downloadManagementReport(
                  result,
                  accountCode,
                  dateFrom || undefined,
                  dateTo || undefined,
                )
              }
            >
              <Download size={13} /> Tải về
            </Button>
          </div>
        )}
      </div>

      {/* ── Empty state ── */}
      {!searched && (
        <div className="flex flex-col items-center justify-center text-muted-foreground py-16 text-sm gap-1">
          <ChevronLeft size={32} className="opacity-30" />
          Chọn loại công nợ và nhấn "Tra cứu" để xem báo cáo tổng hợp
        </div>
      )}

      {reportQuery.isFetching && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-sm">
          <Loader2 className="animate-spin" size={18} /> Đang tải...
        </div>
      )}

      {/* ── Table ── */}
      {result && !reportQuery.isFetching && (
        <>
          <div className="bg-card rounded-lg border border-border overflow-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="bg-muted/60 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <th className="text-left px-3 py-2 w-28">Mã ĐT</th>
                  <th className="text-left px-3 py-2">Tên đối tác</th>
                  <th className="text-left px-3 py-2 w-32">Mã số thuế</th>
                  <th className="text-right px-3 py-2 w-36">Dư đầu kỳ</th>
                  <th className="text-right px-3 py-2 w-32">PS Nợ</th>
                  <th className="text-right px-3 py-2 w-32">PS Có</th>
                  <th className="text-right px-3 py-2 w-36">Dư cuối kỳ</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-8 text-xs text-muted-foreground"
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  result.rows.map((row) => (
                    <tr
                      key={row.partnerId}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-3 py-2 font-medium text-primary text-xs">
                        {row.partnerCode}
                      </td>
                      <td className="px-3 py-2 text-xs">{row.partnerName}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {row.taxCode ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {fmtBalance(row.openingBalance)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {fmtVND(row.periodDebit)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {fmtVND(row.periodCredit)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs font-semibold">
                        {fmtBalance(row.closingBalance)}
                      </td>
                    </tr>
                  ))
                )}

                {/* Totals */}
                {result.rows.length > 0 && (
                  <tr className="bg-muted/30 font-semibold border-t-2 border-border/60">
                    <td className="px-3 py-2 text-xs" colSpan={3}>
                      Tổng cộng
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {fmtBalance(result.totals.openingBalance)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {fmtVND(result.totals.periodDebit)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {fmtVND(result.totals.periodCredit)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs font-bold">
                      {fmtBalance(result.totals.closingBalance)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>
                {result.total} đối tác — trang {result.page}/{totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={13} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={13} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

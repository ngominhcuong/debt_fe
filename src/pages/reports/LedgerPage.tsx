import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Loader2,
  ChevronLeft,
  Download,
  Printer,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { api, type Account, type LedgerResult } from "@/lib/api";
import { openPrintPreviewWindow } from "@/lib/print-preview";
import { useAuth } from "@/contexts/AuthContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtVND(val: number): string {
  if (val === 0) return "—";
  return new Intl.NumberFormat("vi-VN").format(Math.round(val));
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

const REF_TYPE_LABELS: Record<string, string> = {
  SALES_INVOICE: "Bán hàng",
  RECEIPT: "Thu tiền",
  PURCHASE_INVOICE: "Mua hàng",
  PAYMENT: "Chi tiền",
};

const COMPANY = {
  name: "CÔNG TY TNHH MWCONNECT VIỆT NAM",
  address: "Xưởng A1, Lô CN17A-3, Khu công nghiệp Quế Võ III, Bắc Ninh",
  website: "www.mwconnect.vn",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtReportAmount(val: number): string {
  if (val === 0) return "";
  return new Intl.NumberFormat("vi-VN").format(Math.round(Math.abs(val)));
}

function reportBalanceColumns(balance: number) {
  if (balance >= 0) {
    return { debit: fmtReportAmount(balance), credit: "" };
  }

  return { debit: "", credit: fmtReportAmount(balance) };
}

function buildLedgerReportHtml(
  ledger: LedgerResult,
  dateFrom?: string,
  dateTo?: string,
) {
  const opening = reportBalanceColumns(ledger.openingBalance);
  const closing = reportBalanceColumns(ledger.closingBalance);
  const periodLabel = `Từ ngày ${dateFrom ? fmtDate(dateFrom) : "đầu kỳ"} đến ngày ${dateTo ? fmtDate(dateTo) : "hiện tại"}`;
  const rows = ledger.lines
    .map((line) => {
      const balance = reportBalanceColumns(line.runningBalance);
      return `
        <tr>
          <td class="text-center text-nowrap">${escapeHtml(fmtDate(line.accountingDate))}</td>
          <td class="text-center text-nowrap">${escapeHtml(fmtDate(line.accountingDate))}</td>
          <td class="text-center text-nowrap">${escapeHtml(line.docNumber ?? line.entryNumber)}</td>
          <td class="text-left">${escapeHtml(line.description ?? "")}</td>
          <td class="text-center text-nowrap">${escapeHtml(line.counterAccountCodes || "-")}</td>
          <td class="text-right">${escapeHtml(fmtReportAmount(line.debitAmount))}</td>
          <td class="text-right">${escapeHtml(fmtReportAmount(line.creditAmount))}</td>
          <td class="text-right">${escapeHtml(balance.debit)}</td>
          <td class="text-right">${escapeHtml(balance.credit)}</td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Sổ chi tiết tài khoản ${escapeHtml(ledger.account.code)}</title>
  <style>
    @page { size: A4 landscape; margin: 18mm 20mm 16mm 20mm; }
    * { box-sizing: border-box; }
    body { font-family: "Times New Roman", serif; font-size: 13px; color: #111; margin: 0; padding: 0; }
    .sheet { width: 100%; }
    @media screen {
      body { background: #e8e8e8; }
      .sheet { background: #fff; max-width: 297mm; margin: 20px auto; padding: 18mm 20mm 16mm 20mm; box-shadow: 0 2px 12px rgba(0,0,0,.18); }
    }
    @media print {
      body { background: none; }
      .sheet { max-width: none; margin: 0; padding: 0; box-shadow: none; }
    }

    /* ── Company / form-code header ── */
    .topbar { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    .topbar td { vertical-align: top; padding: 0; }
    .topbar td:first-child { width: 60%; }
    .topbar td:last-child  { width: 40%; text-align: right; }
    .company-name { font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; }
    .company-sub  { font-size: 12px; margin-bottom: 2px; }
    .form-code    { font-size: 12px; font-weight: 700; line-height: 1.6; }
    .form-code em { font-style: normal; font-weight: 400; }

    /* ── Document title ── */
    .title { text-align: center; margin: 6px 0 12px; }
    .title h1   { margin: 0 0 4px; font-size: 22px; letter-spacing: 1px; text-transform: uppercase; }
    .title .sub { font-size: 14px; font-weight: 700; margin-bottom: 3px; }
    .title .period { font-size: 13px; font-weight: 400; font-style: italic; }

    /* ── Opening balance ── */
    .opening { font-size: 13px; font-weight: 700; margin: 0 0 8px; text-align: right; }

    /* ── Ledger table ── */
    table.ledger { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 12px; }
    table.ledger th,
    table.ledger td  { border: 1px solid #555; padding: 5px 7px; font-size: 12px; vertical-align: middle; }
    table.ledger thead th { background: #dce8f6; text-align: center; font-weight: 700; line-height: 1.4; }
    table.ledger tbody td { vertical-align: top; }
    table.ledger .text-left  { text-align: left; }
    table.ledger .text-right { text-align: right; white-space: nowrap; }
    table.ledger .text-center { text-align: center; }
    table.ledger .text-nowrap { white-space: nowrap; }
    table.ledger tbody tr:nth-child(even) { background: #f7fafd; }
    table.ledger .sum-row td { font-weight: 700; background: #eef4fb; border-top: 2px solid #555; }

    /* ── Footer note ── */
    .footer-note { font-size: 12px; line-height: 1.8; margin-bottom: 18px; }

    /* ── Signatures ── */
    .signatures { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .signatures td { width: 33.33%; text-align: center; vertical-align: top;
                     font-size: 13px; font-weight: 700; padding: 0 8px; }
    .signatures .hint  { display: block; font-style: italic; font-weight: 400; font-size: 12px; margin-top: 2px; }
    .signatures .space { display: block; height: 64px; }
  </style>
</head>
<body>
  <div class="sheet">

    <table class="topbar">
      <tr>
        <td>
          <div class="company-name">${escapeHtml(COMPANY.name)}</div>
          <div class="company-sub">${escapeHtml(COMPANY.address)}</div>
          <div class="company-sub">${escapeHtml(COMPANY.website)}</div>
        </td>
        <td>
          <div class="form-code">
            Mẫu số S38-DN<br />
            <em>(Ban hành theo Thông tư số 200/2014/TT-BTC<br />ngày 22/12/2014 của Bộ Tài chính)</em>
          </div>
        </td>
      </tr>
    </table>

    <div class="title">
      <h1>Sổ Chi Tiết Tài Khoản</h1>
      <div class="sub">Tài khoản: ${escapeHtml(ledger.account.code)} – ${escapeHtml(ledger.account.name)}</div>
      <div class="period">${escapeHtml(periodLabel)}</div>
    </div>

    <div class="opening">Số dư đầu kỳ:&nbsp; ${escapeHtml(opening.debit || opening.credit || "0")}</div>

    <table class="ledger">
      <colgroup>
        <col style="width: 9%"  /><!-- Ngày ghi sổ -->
        <col style="width: 9%"  /><!-- CT Ngày -->
        <col style="width: 15%" /><!-- CT Số -->
        <col style="width: 29%" /><!-- Diễn giải -->
        <col style="width: 10%" /><!-- TK đối ứng -->
        <col style="width: 8%"  /><!-- PS Nợ -->
        <col style="width: 8%"  /><!-- PS Có -->
        <col style="width: 6%"  /><!-- Dư Nợ -->
        <col style="width: 6%"  /><!-- Dư Có -->
      </colgroup>
      <thead>
        <tr>
          <th rowspan="2">Ngày<br />ghi sổ</th>
          <th colspan="2">Chứng từ</th>
          <th rowspan="2">Diễn giải</th>
          <th rowspan="2">TK<br />đối ứng</th>
          <th colspan="2">Số phát sinh</th>
          <th colspan="2">Số dư</th>
        </tr>
        <tr>
          <th>Ngày</th>
          <th>Số</th>
          <th>Nợ</th>
          <th>Có</th>
          <th>Nợ</th>
          <th>Có</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="9" class="text-center" style="padding: 10px;">Không có phát sinh trong kỳ</td></tr>'}
        <tr class="sum-row">
          <td colspan="5" class="text-right">Tổng cộng phát sinh trong kỳ</td>
          <td class="text-right">${escapeHtml(fmtReportAmount(ledger.totalDebit))}</td>
          <td class="text-right">${escapeHtml(fmtReportAmount(ledger.totalCredit))}</td>
          <td class="text-right">${escapeHtml(closing.debit)}</td>
          <td class="text-right">${escapeHtml(closing.credit)}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer-note">
      Sổ này có 01 trang, đánh số từ trang số 01 đến trang 01<br />
      Ngày mở sổ: ${escapeHtml(dateFrom ? fmtDate(dateFrom) : fmtDate(new Date().toISOString()))}
    </div>

    <table class="signatures">
      <tr>
        <td>NGƯỜI GHI SỔ<span class="hint">(Ký, họ tên)</span></td>
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

function openLedgerPrintPreview(
  ledger: LedgerResult,
  dateFrom?: string,
  dateTo?: string,
) {
  const html = buildLedgerReportHtml(ledger, dateFrom, dateTo);
  openPrintPreviewWindow(html, `So chi tiet tai khoan ${ledger.account.code}`);
}

function downloadLedgerReport(
  ledger: LedgerResult,
  dateFrom?: string,
  dateTo?: string,
) {
  openLedgerPrintPreview(ledger, dateFrom, dateTo);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LedgerPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searched, setSearched] = useState(false);

  const accountsQuery = useQuery({
    queryKey: ["accounts-all", token],
    queryFn: () =>
      api.master.listAccounts(token, { isActive: true }).then((r) => r.data),
    enabled: !!token,
    staleTime: 120_000,
  });
  const allAccounts: Account[] = accountsQuery.data ?? [];
  const selectedAccount = allAccounts.find((a) => a.id === selectedAccountId);

  const ledgerQuery = useQuery({
    queryKey: ["ledger", selectedAccountId, dateFrom, dateTo, token],
    queryFn: () =>
      api.report
        .getLedger(
          {
            accountId: selectedAccountId,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          },
          token,
        )
        .then((r) => r.data),
    enabled: searched && !!selectedAccountId && !!token,
    staleTime: 30_000,
  });

  const ledger = ledgerQuery.data;

  function handleSearch() {
    if (!selectedAccountId) return;
    setSearched(true);
    ledgerQuery.refetch();
  }

  return (
    <>
      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div className="flex-1 min-w-[260px]">
          <Label className="text-xs mb-1 block">
            Tài khoản <span className="text-destructive">*</span>
          </Label>
          <Popover open={accountOpen} onOpenChange={setAccountOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={accountOpen}
                className="h-8 text-sm w-full justify-between font-normal"
              >
                {selectedAccount ? (
                  <span className="truncate text-left">
                    <span className="font-mono text-primary mr-1">
                      {selectedAccount.code}
                    </span>
                    — {selectedAccount.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Chọn tài khoản...
                  </span>
                )}
                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0 w-[var(--radix-popover-trigger-width)]"
              align="start"
            >
              <Command>
                <CommandInput
                  placeholder="Tìm theo mã hoặc tên..."
                  className="h-8 text-xs"
                />
                <CommandList>
                  <CommandEmpty>Không tìm thấy tài khoản.</CommandEmpty>
                  <CommandGroup>
                    {allAccounts.slice(0, 200).map((a) => (
                      <CommandItem
                        key={a.id}
                        value={`${a.code} ${a.name}`}
                        onSelect={() => {
                          setSelectedAccountId(a.id);
                          setAccountOpen(false);
                        }}
                        className="text-xs"
                      >
                        <Check
                          className={
                            selectedAccountId === a.id
                              ? "mr-1 h-3.5 w-3.5 opacity-100"
                              : "mr-1 h-3.5 w-3.5 opacity-0"
                          }
                        />
                        <span className="font-mono text-primary mr-1">
                          {a.code}
                        </span>
                        — {a.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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

        <Button
          size="sm"
          className="h-8 gap-1.5"
          onClick={handleSearch}
          disabled={!selectedAccountId}
        >
          {ledgerQuery.isFetching ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Search size={13} />
          )}
          Tra cứu
        </Button>

        {ledger && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
              onClick={() => openLedgerPrintPreview(ledger, dateFrom, dateTo)}
            >
              <Printer size={13} />
              In sổ
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
              onClick={() => downloadLedgerReport(ledger, dateFrom, dateTo)}
            >
              <Download size={13} />
              Tải về
            </Button>
          </div>
        )}
      </div>

      {/* ── Empty state ── */}
      {!searched && (
        <div className="flex flex-col items-center justify-center text-muted-foreground py-16 text-sm gap-1">
          <ChevronLeft size={32} className="opacity-30" />
          Chọn tài khoản và nhấn "Tra cứu" để xem sổ cái
        </div>
      )}

      {ledgerQuery.isFetching && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-sm">
          <Loader2 className="animate-spin" size={18} /> Đang tải...
        </div>
      )}

      {/* ── Ledger table ── */}
      {ledger && !ledgerQuery.isFetching && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <div className="text-sm font-semibold">
              <span className="text-muted-foreground mr-1">Tài khoản:</span>
              <span className="font-mono text-primary">
                {ledger.account.code}
              </span>
              <span className="mx-1">—</span>
              {ledger.account.name}
            </div>
            <Badge variant="outline" className="text-xs">
              {ledger.account.normalBalance === "DEBIT" ? "Dư Nợ" : "Dư Có"}
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto">
              {ledger.total} dòng phát sinh
              {ledger.total > 1000 && " (hiển thị 1.000 đầu)"}
            </span>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="bg-muted/60 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <th className="text-left px-3 py-2 w-28">Ngày</th>
                  <th className="text-left px-3 py-2 w-44">Chứng từ</th>
                  <th className="text-left px-3 py-2 w-28">Tk đối ứng</th>
                  <th className="text-left px-3 py-2 w-24">Loại</th>
                  <th className="text-left px-3 py-2">Diễn giải</th>
                  <th className="text-left px-3 py-2 w-36">Đối tượng</th>
                  <th className="text-right px-3 py-2 w-32">Nợ (VNĐ)</th>
                  <th className="text-right px-3 py-2 w-32">Có (VNĐ)</th>
                  <th className="text-right px-3 py-2 w-36">Số dư</th>
                </tr>
              </thead>
              <tbody>
                {/* Opening balance */}
                <tr className="bg-muted/30 font-semibold border-b">
                  <td className="px-3 py-2 text-xs" colSpan={8}>
                    Dư đầu kỳ
                    {dateFrom && (
                      <span className="text-muted-foreground ml-1 font-normal text-xs">
                        (trước {fmtDate(dateFrom)})
                      </span>
                    )}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono text-sm ${ledger.openingBalance < 0 ? "text-destructive" : ""}`}
                  >
                    {ledger.openingBalance < 0
                      ? `(${fmtVND(Math.abs(ledger.openingBalance))})`
                      : fmtVND(ledger.openingBalance)}
                  </td>
                </tr>

                {ledger.lines.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-8 text-xs text-muted-foreground"
                    >
                      Không có phát sinh trong kỳ
                    </td>
                  </tr>
                ) : (
                  ledger.lines.map((line) => (
                    <tr
                      key={line.id}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-3 py-1.5 text-xs whitespace-nowrap text-center">
                        {fmtDate(line.accountingDate)}
                      </td>
                      <td
                        className="px-3 py-1.5 text-xs font-medium text-primary whitespace-nowrap max-w-[180px] truncate"
                        title={line.docNumber ?? line.entryNumber}
                      >
                        {line.docNumber ?? line.entryNumber}
                      </td>
                      <td className="px-3 py-1.5 text-xs whitespace-nowrap">
                        {line.counterAccountCodes || "—"}
                      </td>
                      <td className="px-3 py-1.5 text-xs text-muted-foreground whitespace-nowrap">
                        {REF_TYPE_LABELS[line.refType] ?? line.refType}
                      </td>
                      <td
                        className="px-3 py-1.5 text-xs max-w-[240px] truncate"
                        title={line.description ?? ""}
                      >
                        {line.description ?? "—"}
                      </td>
                      <td className="px-3 py-1.5 text-xs text-muted-foreground max-w-[140px] truncate">
                        {line.partner ? `${line.partner.code}` : "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs">
                        {line.debitAmount > 0 ? fmtVND(line.debitAmount) : ""}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs">
                        {line.creditAmount > 0 ? fmtVND(line.creditAmount) : ""}
                      </td>
                      <td
                        className={`px-3 py-1.5 text-right font-mono text-xs font-semibold ${line.runningBalance < 0 ? "text-destructive" : ""}`}
                      >
                        {line.runningBalance < 0
                          ? `(${fmtVND(Math.abs(line.runningBalance))})`
                          : fmtVND(line.runningBalance)}
                      </td>
                    </tr>
                  ))
                )}

                {/* Period totals */}
                {ledger.lines.length > 0 && (
                  <tr className="bg-muted/30 font-semibold border-t-2 border-border/60">
                    <td className="px-3 py-2 text-xs" colSpan={6}>
                      Cộng phát sinh kỳ
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {fmtVND(ledger.totalDebit)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {fmtVND(ledger.totalCredit)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs" />
                  </tr>
                )}

                {/* Closing balance */}
                <tr className="bg-primary/5 font-bold border-t-2 border-primary/20">
                  <td className="px-3 py-2 text-xs" colSpan={8}>
                    Dư cuối kỳ
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono text-sm ${ledger.closingBalance < 0 ? "text-destructive" : "text-primary"}`}
                  >
                    {ledger.closingBalance < 0
                      ? `(${fmtVND(Math.abs(ledger.closingBalance))})`
                      : fmtVND(ledger.closingBalance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

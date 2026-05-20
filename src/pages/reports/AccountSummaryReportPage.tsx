import { useEffect, useState } from "react";
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
import { api, type Account, type AccountSummaryResult } from "@/lib/api";
import { openPrintPreviewWindow } from "@/lib/print-preview";
import { useAuth } from "@/contexts/AuthContext";

function fmtVND(val: number): string {
  if (val === 0) return "—";
  return new Intl.NumberFormat("vi-VN").format(Math.round(val));
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function fmtBalance(val: number) {
  if (val < 0)
    return <span className="text-destructive">({fmtVND(Math.abs(val))})</span>;
  return <>{fmtVND(val)}</>;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => {
    if (char === "&") return "&amp;";
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    return "&quot;";
  });
}

function buildSummaryHtml(
  result: AccountSummaryResult,
  dateFrom?: string,
  dateTo?: string,
): string {
  const periodLabel = `Từ ngày ${dateFrom ? fmtDate(dateFrom) : "đầu kỳ"} đến ngày ${dateTo ? fmtDate(dateTo) : "hiện tại"}`;
  const rows = result.rows
    .map(
      (row, index) => `
        <tr class="${index % 2 === 1 ? "even" : ""}">
          <td class="center">${index + 1}</td>
          <td class="mono">${escapeHtml(row.accountCode)}</td>
          <td>${escapeHtml(row.accountName)}</td>
          <td class="right">${escapeHtml(fmtBalanceText(row.openingBalance))}</td>
          <td class="right">${escapeHtml(fmtMoneyText(row.periodDebit))}</td>
          <td class="right">${escapeHtml(fmtMoneyText(row.periodCredit))}</td>
          <td class="right bold">${escapeHtml(fmtBalanceText(row.closingBalance))}</td>
        </tr>`,
    )
    .join("");

  const totals = result.totals;
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Sổ tổng hợp tài khoản ${escapeHtml(result.account.code)}</title>
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
    .topbar td:first-child { width: 60%; }
    .topbar td:last-child { width: 40%; text-align: right; }
    .company-name { font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; }
    .company-sub { font-size: 12px; margin-bottom: 2px; }
    .title { text-align: center; margin: 4px 0 14px; }
    .title h1 { margin: 0 0 4px; font-size: 20px; letter-spacing: 0.5px; text-transform: uppercase; }
    .title .sub { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
    .title .period { font-size: 12px; font-style: italic; }
    table.rpt { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 14px; }
    table.rpt th, table.rpt td { border: 1px solid #555; padding: 5px 7px; font-size: 12px; vertical-align: middle; }
    table.rpt thead th { background: #dce8f6; text-align: center; font-weight: 700; }
    table.rpt tbody tr.even { background: #f7fafd; }
    table.rpt .sum-row td { font-weight: 700; background: #eef4fb; border-top: 2px solid #555; }
    table.rpt .center { text-align: center; }
    table.rpt .right { text-align: right; white-space: nowrap; }
    table.rpt .mono { font-family: monospace; }
    table.rpt .bold { font-weight: 700; }
    .signatures { width: 100%; border-collapse: collapse; margin-top: 14px; }
    .signatures td { width: 33.33%; text-align: center; vertical-align: top; font-size: 13px; font-weight: 700; padding: 0 8px; }
    .signatures .hint { display: block; font-style: italic; font-weight: 400; font-size: 12px; margin-top: 2px; }
    .signatures .space { display: block; height: 60px; }
  </style>
</head>
<body>
  <div class="page-wrap">
    <table class="topbar">
      <tr>
        <td>
          <div class="company-name">CÔNG TY TNHH MWCONNECT VIỆT NAM</div>
          <div class="company-sub">Xưởng A1, Lô CN17A-3, Khu công nghiệp Quế Võ III, Bắc Ninh</div>
        </td>
        <td>
          <div><b>Bảng tổng hợp tài khoản</b></div>
          <div><em style="font-weight:400">Ngày in: ${escapeHtml(fmtDate(new Date().toISOString()))}</em></div>
        </td>
      </tr>
    </table>

    <div class="title">
      <h1>Sổ Tổng Hợp Tài Khoản</h1>
      <div class="sub">Tài khoản: ${escapeHtml(result.account.code)} — ${escapeHtml(result.account.name)}</div>
      <div class="period">${escapeHtml(periodLabel)}</div>
    </div>

    <table class="rpt">
      <colgroup>
        <col style="width:4%" />
        <col style="width:12%" />
        <col style="width:34%" />
        <col style="width:12%" />
        <col style="width:12%" />
        <col style="width:12%" />
        <col style="width:14%" />
      </colgroup>
      <thead>
        <tr>
          <th>STT</th>
          <th>Mã TK</th>
          <th>Tên tài khoản</th>
          <th>Dư đầu kỳ</th>
          <th>PS Nợ</th>
          <th>PS Có</th>
          <th>Dư cuối kỳ</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="7" class="center" style="padding:10px">Không có tài khoản chi tiết</td></tr>'}
        <tr class="sum-row">
          <td colspan="3" class="right">Tổng cộng</td>
          <td class="right">${escapeHtml(fmtBalanceText(totals.openingBalance))}</td>
          <td class="right">${escapeHtml(fmtMoneyText(totals.periodDebit))}</td>
          <td class="right">${escapeHtml(fmtMoneyText(totals.periodCredit))}</td>
          <td class="right">${escapeHtml(fmtBalanceText(totals.closingBalance))}</td>
        </tr>
      </tbody>
    </table>

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

function fmtMoneyText(val: number): string {
  if (val === 0) return "—";
  return new Intl.NumberFormat("vi-VN").format(Math.round(Math.abs(val)));
}

function fmtBalanceText(val: number): string {
  if (val === 0) return "0";
  const amount = new Intl.NumberFormat("vi-VN").format(
    Math.round(Math.abs(val)),
  );
  return val < 0 ? `(${amount})` : amount;
}

function openSummaryPrint(
  result: AccountSummaryResult,
  dateFrom?: string,
  dateTo?: string,
) {
  const html = buildSummaryHtml(result, dateFrom, dateTo);
  openPrintPreviewWindow(html, `So tong hop tai khoan ${result.account.code}`);
}

export default function AccountSummaryReportPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searched, setSearched] = useState(false);

  const accountsQuery = useQuery({
    queryKey: ["accounts-summary", token],
    queryFn: () =>
      api.master.listAccounts(token, { isActive: true }).then((r) => r.data),
    enabled: !!token,
    staleTime: 120_000,
  });

  const allAccounts: Account[] = accountsQuery.data ?? [];
  const summaryAccounts = allAccounts
    .filter((account) => !account.isPosting)
    .sort((a, b) => a.code.localeCompare(b.code));
  const selectedAccount = allAccounts.find((a) => a.id === selectedAccountId);

  useEffect(() => {
    if (selectedAccountId || summaryAccounts.length === 0) return;
    const preferred = summaryAccounts.find((account) => account.code === "111");
    setSelectedAccountId(preferred?.id ?? summaryAccounts[0].id);
  }, [selectedAccountId, summaryAccounts]);

  const reportQuery = useQuery({
    queryKey: ["account-summary", selectedAccountId, dateFrom, dateTo, token],
    queryFn: () =>
      api.report
        .getAccountSummary(
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

  const result = reportQuery.data;

  function handleSearch() {
    if (!selectedAccountId) return;
    setSearched(true);
    reportQuery.refetch();
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div className="flex-1 min-w-[260px]">
          <Label className="text-xs mb-1 block">
            Tài khoản tổng hợp <span className="text-destructive">*</span>
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
                    Chọn tài khoản tổng hợp...
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
                    {summaryAccounts.slice(0, 200).map((account) => (
                      <CommandItem
                        key={account.id}
                        value={`${account.code} ${account.name}`}
                        onSelect={() => {
                          setSelectedAccountId(account.id);
                          setAccountOpen(false);
                        }}
                        className="text-xs"
                      >
                        <Check
                          className={
                            selectedAccountId === account.id
                              ? "mr-1 h-3.5 w-3.5 opacity-100"
                              : "mr-1 h-3.5 w-3.5 opacity-0"
                          }
                        />
                        <span className="font-mono text-primary mr-1">
                          {account.code}
                        </span>
                        — {account.name}
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
                openSummaryPrint(
                  result,
                  dateFrom || undefined,
                  dateTo || undefined,
                )
              }
            >
              <Printer size={13} />
              In sổ
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
              onClick={() =>
                openSummaryPrint(
                  result,
                  dateFrom || undefined,
                  dateTo || undefined,
                )
              }
            >
              <Download size={13} />
              Tải về
            </Button>
          </div>
        )}
      </div>

      {!searched && (
        <div className="flex flex-col items-center justify-center text-muted-foreground py-16 text-sm gap-1">
          <ChevronLeft size={32} className="opacity-30" />
          Chọn tài khoản tổng hợp và nhấn "Tra cứu" để xem sổ tổng hợp
        </div>
      )}

      {reportQuery.isFetching && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-sm">
          <Loader2 className="animate-spin" size={18} /> Đang tải...
        </div>
      )}

      {result && !reportQuery.isFetching && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <div className="text-sm font-semibold">
              <span className="text-muted-foreground mr-1">Tài khoản:</span>
              <span className="font-mono text-primary">
                {result.account.code}
              </span>
              <span className="mx-1">—</span>
              {result.account.name}
            </div>
            <Badge variant="outline" className="text-xs">
              {result.account.normalBalance === "DEBIT" ? "Dư Nợ" : "Dư Có"}
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto">
              {result.total} tài khoản chi tiết
            </span>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="bg-muted/60 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <th className="text-left px-3 py-2 w-16">STT</th>
                  <th className="text-left px-3 py-2 w-28">Mã TK</th>
                  <th className="text-left px-3 py-2">Tên tài khoản</th>
                  <th className="text-right px-3 py-2 w-32">Dư đầu kỳ</th>
                  <th className="text-right px-3 py-2 w-32">PS Nợ</th>
                  <th className="text-right px-3 py-2 w-32">PS Có</th>
                  <th className="text-right px-3 py-2 w-32">Dư cuối kỳ</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-8 text-xs text-muted-foreground"
                    >
                      Không có tài khoản chi tiết nào
                    </td>
                  </tr>
                ) : (
                  result.rows.map((row, index) => (
                    <tr
                      key={row.accountId}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2 text-xs font-mono text-primary">
                        {row.accountCode}
                      </td>
                      <td className="px-3 py-2 text-xs">{row.accountName}</td>
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

                {result.rows.length > 0 && (
                  <tr className="bg-muted/30 font-semibold border-t-2 border-border/60">
                    <td className="px-3 py-2 text-xs" colSpan={3}>
                      Cộng phát sinh
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
        </>
      )}
    </>
  );
}

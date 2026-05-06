import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Loader2,
  Printer,
  ChevronLeft,
  Download,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, type Partner, type ReconciliationResult } from "@/lib/api";
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

function fmtBalance(val: number) {
  if (val < 0)
    return <span className="text-destructive">({fmtVND(Math.abs(val))})</span>;
  return <>{fmtVND(val)}</>;
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

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtAmt(val: number): string {
  if (val === 0) return "";
  return new Intl.NumberFormat("vi-VN").format(Math.round(Math.abs(val)));
}

function fmtBalAmt(val: number): string {
  if (val === 0) return "0";
  const s = new Intl.NumberFormat("vi-VN").format(Math.round(Math.abs(val)));
  return val < 0 ? `(${s})` : s;
}

function buildReconciliationHtml(
  reco: ReconciliationResult,
  dateFrom?: string,
  dateTo?: string,
): string {
  const periodLabel = `Từ ngày ${dateFrom ? fmtDate(dateFrom) : "đầu kỳ"} đến ngày ${dateTo ? fmtDate(dateTo) : "hiện tại"}`;
  const today = fmtDate(new Date().toISOString());

  const rows = reco.movements
    .map(
      (mv) => `
    <tr>
      <td class="center nowrap">${escapeHtml(fmtDate(mv.accountingDate))}</td>
      <td class="center mono nowrap">${escapeHtml(mv.accountCode)}</td>
      <td class="center nowrap">${escapeHtml(mv.docNumber ?? "—")}</td>
      <td>${escapeHtml(REF_TYPE_LABELS[mv.refType] ?? mv.refType)}</td>
      <td>${escapeHtml(mv.description ?? "—")}</td>
      <td class="right">${escapeHtml(fmtAmt(mv.debitAmount))}</td>
      <td class="right">${escapeHtml(fmtAmt(mv.creditAmount))}</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Biên bản đối chiếu công nợ — ${escapeHtml(reco.partner.code)}</title>
  <style>
    @page { size: A4 portrait; margin: 20mm 20mm 18mm 25mm; }
    * { box-sizing: border-box; }
    body { font-family: "Times New Roman", serif; font-size: 13px; color: #111; margin: 0; padding: 0; }
    @media screen {
      body { background: #e8e8e8; }
      .page-wrap { background: #fff; max-width: 210mm; margin: 20px auto; padding: 20mm 20mm 18mm 25mm; box-shadow: 0 2px 12px rgba(0,0,0,.18); }
    }
    @media print {
      body { background: none; }
      .page-wrap { max-width: none; margin: 0; padding: 0; box-shadow: none; }
    }

    /* header */
    .topbar { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .topbar td { vertical-align: top; padding: 0; }
    .topbar td:first-child { width: 55%; }
    .topbar td:last-child  { width: 45%; text-align: right; }
    .company-name { font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; }
    .company-sub  { font-size: 12px; margin-bottom: 2px; }
    .form-note    { font-size: 12px; line-height: 1.6; }

    /* title */
    .title { text-align: center; margin: 4px 0 14px; }
    .title h1  { margin: 0 0 4px; font-size: 20px; letter-spacing: 0.5px; text-transform: uppercase; }
    .title .sub   { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
    .title .period { font-size: 12px; font-style: italic; }

    /* partner card */
    .partner-card { border: 1px solid #999; border-radius: 4px; padding: 8px 12px; margin-bottom: 12px; font-size: 12px; }
    .partner-card .name { font-weight: 700; font-size: 13px; margin-bottom: 4px; }
    .partner-card .row  { margin-bottom: 2px; }

    /* summary */
    table.summary { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    table.summary th, table.summary td { border: 1px solid #666; padding: 5px 8px; font-size: 12px; }
    table.summary th { background: #dce8f6; text-align: center; font-weight: 700; }
    table.summary td { text-align: right; font-weight: 700; }
    table.summary td.label { text-align: left; font-weight: 400; }

    /* movement table */
    table.mv { width: 100%; border-collapse: collapse; margin-bottom: 12px; table-layout: fixed; }
    table.mv th, table.mv td { border: 1px solid #666; padding: 5px 7px; font-size: 11px; vertical-align: top; }
    table.mv thead th { background: #dce8f6; text-align: center; font-weight: 700; }
    table.mv tbody tr:nth-child(even) { background: #f7fafd; }
    table.mv .sum-row td { font-weight: 700; background: #eef4fb; border-top: 2px solid #555; }
    table.mv .center { text-align: center; }
    table.mv .right  { text-align: right; white-space: nowrap; }
    table.mv .mono   { font-family: monospace; }
    table.mv .nowrap { white-space: nowrap; overflow: hidden; }

    /* signatures */
    .signatures { width: 100%; border-collapse: collapse; margin-top: 18px; }
    .signatures td { width: 50%; text-align: center; vertical-align: top;
                     font-size: 13px; font-weight: 700; padding: 0 10px; }
    .signatures .hint  { display: block; font-style: italic; font-weight: 400; font-size: 12px; margin-top: 2px; }
    .signatures .space { display: block; height: 60px; }
    .date-line { text-align: center; font-size: 12px; font-style: italic; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="page-wrap">
  <table class="topbar">
    <tr>
      <td>
        <div class="company-name">${escapeHtml(COMPANY.name)}</div>
        <div class="company-sub">${escapeHtml(COMPANY.address)}</div>
        <div class="company-sub">${escapeHtml(COMPANY.website)}</div>
      </td>
      <td>
        <div class="form-note">
          Mẫu biên bản đối chiếu công nợ<br />
          <em style="font-weight:400">Ngày in: ${escapeHtml(today)}</em>
        </div>
      </td>
    </tr>
  </table>

  <div class="title">
    <h1>Biên Bản Đối Chiếu Công Nợ</h1>
    <div class="sub">Đối tác: ${escapeHtml(reco.partner.code)} — ${escapeHtml(reco.partner.name)}</div>
    <div class="period">${escapeHtml(periodLabel)}</div>
  </div>

  <div class="partner-card">
    <div class="name">${escapeHtml(reco.partner.name)}</div>
    ${reco.partner.taxCode ? `<div class="row"><b>Mã số thuế:</b> ${escapeHtml(reco.partner.taxCode)}</div>` : ""}
    ${reco.partner.address ? `<div class="row"><b>Địa chỉ:</b> ${escapeHtml(reco.partner.address)}</div>` : ""}
    ${reco.partner.phone ? `<div class="row"><b>Điện thoại:</b> ${escapeHtml(reco.partner.phone)}</div>` : ""}
  </div>

  <table class="summary">
    <thead><tr>
      <th style="width:35%">Chỉ tiêu</th>
      <th style="width:65%">Số tiền (VNĐ)</th>
    </tr></thead>
    <tbody>
      <tr><td class="label">Dư đầu kỳ</td><td>${escapeHtml(fmtBalAmt(reco.openingBalance))}</td></tr>
      <tr><td class="label">Cộng phát sinh Nợ</td><td>${escapeHtml(fmtAmt(reco.totalDebit) || "0")}</td></tr>
      <tr><td class="label">Cộng phát sinh Có</td><td>${escapeHtml(fmtAmt(reco.totalCredit) || "0")}</td></tr>
      <tr><td class="label"><b>Dư cuối kỳ</b></td><td><b>${escapeHtml(fmtBalAmt(reco.closingBalance))}</b></td></tr>
    </tbody>
  </table>

  <table class="mv">
    <colgroup>
      <col style="width:11%" />
      <col style="width:7%" />
      <col style="width:16%" />
      <col style="width:11%" />
      <col style="width:35%" />
      <col style="width:10%" />
      <col style="width:10%" />
    </colgroup>
    <thead>
      <tr>
        <th>Ngày</th>
        <th>TK</th>
        <th>Chứng từ</th>
        <th>Loại</th>
        <th>Diễn giải</th>
        <th>Nợ</th>
        <th>Có</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="7" class="center" style="padding:10px">Không có phát sinh trong kỳ</td></tr>'}
      ${
        reco.movements.length > 0
          ? `
      <tr class="sum-row">
        <td colspan="5" class="right">Cộng phát sinh kỳ</td>
        <td class="right">${escapeHtml(fmtAmt(reco.totalDebit) || "0")}</td>
        <td class="right">${escapeHtml(fmtAmt(reco.totalCredit) || "0")}</td>
      </tr>`
          : ""
      }
    </tbody>
  </table>

  <p class="date-line">Ngày &nbsp;...... &nbsp; tháng &nbsp;...... &nbsp; năm ${new Date().getFullYear()}</p>
  <table class="signatures">
    <tr>
      <td>ĐẠI DIỆN BÊN A<span class="hint">(${escapeHtml(COMPANY.name)})</span><span class="hint">(Ký, họ tên, đóng dấu)</span></td>
      <td>ĐẠI DIỆN BÊN B<span class="hint">(${escapeHtml(reco.partner.name)})</span><span class="hint">(Ký, họ tên, đóng dấu)</span></td>
    </tr>
    <tr>
      <td><span class="space"></span></td>
      <td><span class="space"></span></td>
    </tr>
  </table>
  </div>
</body>
</html>`;
}

function openReconciliationPrint(
  reco: ReconciliationResult,
  dateFrom?: string,
  dateTo?: string,
) {
  const html = buildReconciliationHtml(reco, dateFrom, dateTo);
  openPrintPreviewWindow(html, `Bien ban doi chieu ${reco.partner.code}`);
}

function downloadReconciliationReport(
  reco: ReconciliationResult,
  dateFrom?: string,
  dateTo?: string,
) {
  openReconciliationPrint(reco, dateFrom, dateTo);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReconciliationPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [accountCode, setAccountCode] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searched, setSearched] = useState(false);

  const partnersQuery = useQuery({
    queryKey: ["partners-all", token],
    queryFn: () =>
      api.master.listPartners(token, { isActive: true }).then((r) => r.data),
    enabled: !!token,
    staleTime: 120_000,
  });
  const allPartners: Partner[] = partnersQuery.data ?? [];
  const selectedPartner = allPartners.find((p) => p.id === selectedPartnerId);

  const recoQuery = useQuery({
    queryKey: [
      "reconciliation",
      selectedPartnerId,
      accountCode,
      dateFrom,
      dateTo,
      token,
    ],
    queryFn: () =>
      api.report
        .getReconciliation(
          {
            partnerId: selectedPartnerId,
            accountCode: accountCode === "all" ? undefined : accountCode,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          },
          token,
        )
        .then((r) => r.data),
    enabled: searched && !!selectedPartnerId && !!token,
    staleTime: 30_000,
  });

  const reco = recoQuery.data;

  function handleSearch() {
    if (!selectedPartnerId) return;
    setSearched(true);
    recoQuery.refetch();
  }

  return (
    <>
      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div className="flex-1 min-w-[260px]">
          <Label className="text-xs mb-1 block">
            Đối tác <span className="text-destructive">*</span>
          </Label>
          <Popover open={partnerOpen} onOpenChange={setPartnerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={partnerOpen}
                className="h-8 text-sm w-full justify-between font-normal"
              >
                {selectedPartner ? (
                  <span className="truncate text-left">
                    <span className="font-mono text-primary mr-1">
                      {selectedPartner.code}
                    </span>
                    — {selectedPartner.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Chọn đối tác...</span>
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
                  <CommandEmpty>Không tìm thấy đối tác.</CommandEmpty>
                  <CommandGroup>
                    {allPartners.slice(0, 200).map((p) => (
                      <CommandItem
                        key={p.id}
                        value={`${p.code} ${p.name}`}
                        onSelect={() => {
                          setSelectedPartnerId(p.id);
                          setPartnerOpen(false);
                        }}
                        className="text-xs"
                      >
                        <Check
                          className={
                            selectedPartnerId === p.id
                              ? "mr-1 h-3.5 w-3.5 opacity-100"
                              : "mr-1 h-3.5 w-3.5 opacity-0"
                          }
                        />
                        <span className="font-mono text-primary mr-1">
                          {p.code}
                        </span>
                        — {p.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label className="text-xs mb-1 block">Tài khoản</Label>
          <Select value={accountCode} onValueChange={setAccountCode}>
            <SelectTrigger className="h-8 text-sm w-44">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                Tất cả
              </SelectItem>
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

        <Button
          size="sm"
          className="h-8 gap-1.5"
          onClick={handleSearch}
          disabled={!selectedPartnerId}
        >
          {recoQuery.isFetching ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Search size={13} />
          )}
          Tra cứu
        </Button>

        {reco && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
              onClick={() =>
                openReconciliationPrint(
                  reco,
                  dateFrom || undefined,
                  dateTo || undefined,
                )
              }
            >
              <Printer size={13} /> In biên bản
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
              onClick={() =>
                downloadReconciliationReport(
                  reco,
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
          Chọn đối tác và nhấn "Tra cứu" để xem đối chiếu công nợ
        </div>
      )}

      {recoQuery.isFetching && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-sm">
          <Loader2 className="animate-spin" size={18} /> Đang tải...
        </div>
      )}

      {/* ── Result ── */}
      {reco && !recoQuery.isFetching && (
        <>
          {/* Summary card */}
          <div className="bg-card rounded-lg border border-border p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2 sm:col-span-4 pb-3 border-b border-border/60">
              <div className="text-sm font-semibold">
                <span className="font-mono text-primary mr-1">
                  {reco.partner.code}
                </span>
                — {reco.partner.name}
              </div>
              {reco.partner.taxCode && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  MST: {reco.partner.taxCode}
                </div>
              )}
              {reco.partner.address && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  Địa chỉ: {reco.partner.address}
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">
                Dư đầu kỳ
              </div>
              <div className="font-mono font-semibold text-sm">
                {fmtBalance(reco.openingBalance)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">PS Nợ</div>
              <div className="font-mono font-semibold text-sm">
                {fmtVND(reco.totalDebit)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">PS Có</div>
              <div className="font-mono font-semibold text-sm">
                {fmtVND(reco.totalCredit)}
              </div>
            </div>
            <div className="text-center bg-primary/5 rounded-md py-1">
              <div className="text-xs text-muted-foreground mb-1">
                Dư cuối kỳ
              </div>
              <div className="font-mono font-bold text-sm text-primary">
                {fmtBalance(reco.closingBalance)}
              </div>
            </div>
          </div>

          {/* Movement table */}
          <div className="bg-card rounded-lg border border-border overflow-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="bg-muted/60 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <th className="text-left px-3 py-2 w-24">Ngày</th>
                  <th className="text-left px-3 py-2 w-24">TK</th>
                  <th className="text-left px-3 py-2 w-32">Chứng từ</th>
                  <th className="text-left px-3 py-2 w-24">Loại</th>
                  <th className="text-left px-3 py-2">Diễn giải</th>
                  <th className="text-right px-3 py-2 w-32">Nợ (VNĐ)</th>
                  <th className="text-right px-3 py-2 w-32">Có (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                {reco.movements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-8 text-xs text-muted-foreground"
                    >
                      Không có phát sinh trong kỳ
                    </td>
                  </tr>
                ) : (
                  reco.movements.map((mv) => (
                    <tr
                      key={`${mv.accountingDate}-${mv.accountCode}-${mv.docNumber ?? mv.refType}-${mv.debitAmount}-${mv.creditAmount}`}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-3 py-1.5 text-xs whitespace-nowrap">
                        {fmtDate(mv.accountingDate)}
                      </td>
                      <td className="px-3 py-1.5 text-xs font-mono text-muted-foreground">
                        {mv.accountCode}
                      </td>
                      <td className="px-3 py-1.5 text-xs font-medium text-primary whitespace-nowrap">
                        {mv.docNumber ?? "—"}
                      </td>
                      <td className="px-3 py-1.5 text-xs text-muted-foreground whitespace-nowrap">
                        {REF_TYPE_LABELS[mv.refType] ?? mv.refType}
                      </td>
                      <td
                        className="px-3 py-1.5 text-xs max-w-[220px] truncate"
                        title={mv.description ?? ""}
                      >
                        {mv.description ?? "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs">
                        {mv.debitAmount > 0 ? fmtVND(mv.debitAmount) : ""}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs">
                        {mv.creditAmount > 0 ? fmtVND(mv.creditAmount) : ""}
                      </td>
                    </tr>
                  ))
                )}

                {/* Period totals */}
                {reco.movements.length > 0 && (
                  <tr className="bg-muted/30 font-semibold border-t-2 border-border/60">
                    <td className="px-3 py-2 text-xs" colSpan={5}>
                      Cộng phát sinh kỳ
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {fmtVND(reco.totalDebit)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {fmtVND(reco.totalCredit)}
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

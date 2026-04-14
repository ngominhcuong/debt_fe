import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, type Account } from "@/lib/api";
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function LedgerPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searched, setSearched] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");

  const accountsQuery = useQuery({
    queryKey: ["accounts-all", token],
    queryFn: () =>
      api.master.listAccounts(token, { isActive: true }).then((r) => r.data),
    enabled: !!token,
    staleTime: 120_000,
  });
  const allAccounts: Account[] = accountsQuery.data ?? [];
  const filteredAccounts = accountSearch.trim()
    ? allAccounts.filter(
        (a) =>
          a.code.toLowerCase().includes(accountSearch.toLowerCase()) ||
          a.name.toLowerCase().includes(accountSearch.toLowerCase()),
      )
    : allAccounts;

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
          <Select
            value={selectedAccountId}
            onValueChange={setSelectedAccountId}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Chọn tài khoản..." />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <div className="px-2 py-1.5 sticky top-0 bg-background border-b">
                <Input
                  className="h-7 text-xs"
                  placeholder="Tìm theo mã hoặc tên..."
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                />
              </div>
              {filteredAccounts.slice(0, 200).map((a) => (
                <SelectItem key={a.id} value={a.id} className="text-xs">
                  <span className="font-mono text-primary mr-1">{a.code}</span>{" "}
                  — {a.name}
                </SelectItem>
              ))}
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
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => window.print()}
          >
            In sổ
          </Button>
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
                  <th className="text-left px-3 py-2 w-24">Ngày</th>
                  <th className="text-left px-3 py-2 w-32">Chứng từ</th>
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
                  <td className="px-3 py-2 text-xs" colSpan={7}>
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
                      colSpan={8}
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
                      <td className="px-3 py-1.5 text-xs whitespace-nowrap">
                        {fmtDate(line.accountingDate)}
                      </td>
                      <td className="px-3 py-1.5 text-xs font-medium text-primary whitespace-nowrap">
                        {line.docNumber ?? line.entryNumber}
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
                    <td className="px-3 py-2 text-xs" colSpan={5}>
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
                  <td className="px-3 py-2 text-xs" colSpan={7}>
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

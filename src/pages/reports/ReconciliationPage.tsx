import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Printer, ChevronLeft } from "lucide-react";
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
import { api, type Partner } from "@/lib/api";
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReconciliationPage() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [accountCode, setAccountCode] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searched, setSearched] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState("");

  const partnersQuery = useQuery({
    queryKey: ["partners-all", token],
    queryFn: () =>
      api.master.listPartners(token, { isActive: true }).then((r) => r.data),
    enabled: !!token,
    staleTime: 120_000,
  });
  const allPartners: Partner[] = partnersQuery.data ?? [];
  const filteredPartners = partnerSearch.trim()
    ? allPartners.filter(
        (p) =>
          p.code.toLowerCase().includes(partnerSearch.toLowerCase()) ||
          p.name.toLowerCase().includes(partnerSearch.toLowerCase()),
      )
    : allPartners;

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
          <Select
            value={selectedPartnerId}
            onValueChange={setSelectedPartnerId}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Chọn đối tác..." />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <div className="px-2 py-1.5 sticky top-0 bg-background border-b">
                <Input
                  className="h-7 text-xs"
                  placeholder="Tìm theo mã hoặc tên..."
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                />
              </div>
              {filteredPartners.slice(0, 200).map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  <span className="font-mono text-primary mr-1">{p.code}</span>{" "}
                  — {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            onClick={() => window.print()}
          >
            <Printer size={13} /> In biên bản
          </Button>
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
                  reco.movements.map((mv, i) => (
                    <tr
                      key={i}
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

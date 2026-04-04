import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const ledgerData = [
  {
    date: "05/03/2026",
    doc: "HD-2026-001",
    desc: "Bán hàng - Cty ABC",
    debit: "110,000,000",
    credit: "",
    balance: "235,000,000",
  },
  {
    date: "15/03/2026",
    doc: "PT-001",
    desc: "Thu tiền - Cty ABC",
    debit: "",
    credit: "50,000,000",
    balance: "185,000,000",
  },
  {
    date: "20/03/2026",
    doc: "HD-2026-004",
    desc: "Bán hàng - Cty MNO",
    debit: "220,000,000",
    credit: "",
    balance: "405,000,000",
  },
];

export default function LedgerPage() {
  return (
    <>
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
          <Label className="text-xs">Tài khoản</Label>
          <Select>
            <SelectTrigger className="w-48 mt-1">
              <SelectValue placeholder="Chọn TK" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="131">131 - Phải thu KH</SelectItem>
              <SelectItem value="331">331 - Phải trả NCC</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Từ ngày</Label>
          <Input type="date" className="w-40 mt-1" />
        </div>
        <div>
          <Label className="text-xs">Đến ngày</Label>
          <Input type="date" className="w-40 mt-1" />
        </div>
        <Button>Tra cứu</Button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-4 py-3">Ngày</th>
              <th className="text-left px-4 py-3">Chứng từ</th>
              <th className="text-left px-4 py-3">Diễn giải</th>
              <th className="text-right px-4 py-3">Nợ (VNĐ)</th>
              <th className="text-right px-4 py-3">Có (VNĐ)</th>
              <th className="text-right px-4 py-3">Số dư</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-secondary/20 font-semibold">
              <td className="px-4 py-2.5" colSpan={5}>
                Dư đầu kỳ
              </td>
              <td className="px-4 py-2.5 text-right font-mono">125,000,000</td>
            </tr>
            {ledgerData.map((row) => (
              <tr
                key={`${row.date}-${row.doc}`}
                className="border-t border-border/50 hover:bg-secondary/20"
              >
                <td className="px-4 py-2.5">{row.date}</td>
                <td className="px-4 py-2.5 text-primary font-medium">
                  {row.doc}
                </td>
                <td className="px-4 py-2.5">{row.desc}</td>
                <td className="px-4 py-2.5 text-right font-mono">
                  {row.debit}
                </td>
                <td className="px-4 py-2.5 text-right font-mono">
                  {row.credit}
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold">
                  {row.balance}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

import PageToolbar from "@/components/shared/PageToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const balances = [
  { code: "KH-001", name: "Cty TNHH ABC", debit: "125,000,000", credit: "0" },
  { code: "KH-002", name: "Cty CP XYZ", debit: "89,500,000", credit: "0" },
  {
    code: "NCC-001",
    name: "Cty TNHH Vật tư DEF",
    debit: "0",
    credit: "210,000,000",
  },
  {
    code: "NCC-002",
    name: "Cty Nguyên liệu GHI",
    debit: "0",
    credit: "75,300,000",
  },
  {
    code: "KH-003",
    name: "Cty CP Thương mại JKL",
    debit: "45,200,000",
    credit: "0",
  },
];

export default function OpeningBalancePage() {
  return (
    <>
      <PageToolbar onImport={() => {}} onExport={() => {}} />
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-4 py-3">Mã ĐT</th>
              <th className="text-left px-4 py-3">Tên đối tác</th>
              <th className="text-right px-4 py-3">Dư Nợ (VNĐ)</th>
              <th className="text-right px-4 py-3">Dư Có (VNĐ)</th>
              <th className="text-center px-4 py-3 w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {balances.map((b) => (
              <tr
                key={b.code}
                className="border-t border-border/50 hover:bg-secondary/20"
              >
                <td className="px-4 py-2.5 font-medium text-primary">
                  {b.code}
                </td>
                <td className="px-4 py-2.5">{b.name}</td>
                <td className="px-4 py-2.5 text-right">
                  <Input
                    defaultValue={b.debit}
                    className="h-8 text-right text-sm font-mono w-40 ml-auto"
                  />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Input
                    defaultValue={b.credit}
                    className="h-8 text-right text-sm font-mono w-40 ml-auto"
                  />
                </td>
                <td className="px-4 py-2.5 text-center">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Lưu
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end">
        <Button>Lưu tất cả</Button>
      </div>
    </>
  );
}

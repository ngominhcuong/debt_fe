import PageToolbar from "@/components/shared/PageToolbar";

const summaryData = [
  {
    code: "KH-001",
    name: "Cty TNHH ABC",
    opening: "125,000,000",
    debit: "350,000,000",
    credit: "280,000,000",
    closing: "195,000,000",
  },
  {
    code: "KH-002",
    name: "Cty CP XYZ",
    opening: "89,500,000",
    debit: "200,000,000",
    credit: "150,000,000",
    closing: "139,500,000",
  },
  {
    code: "NCC-001",
    name: "Cty TNHH Vật tư DEF",
    opening: "210,000,000",
    debit: "100,000,000",
    credit: "180,000,000",
    closing: "130,000,000",
  },
  {
    code: "KH-003",
    name: "Cty CP JKL",
    opening: "45,200,000",
    debit: "80,000,000",
    credit: "49,500,000",
    closing: "75,700,000",
  },
];

export default function ManagementReportPage() {
  return (
    <>
      <PageToolbar onExport={() => {}} />
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-4 py-3">Mã ĐT</th>
              <th className="text-left px-4 py-3">Tên đối tác</th>
              <th className="text-right px-4 py-3">Dư đầu kỳ</th>
              <th className="text-right px-4 py-3">PS Nợ</th>
              <th className="text-right px-4 py-3">PS Có</th>
              <th className="text-right px-4 py-3">Dư cuối kỳ</th>
            </tr>
          </thead>
          <tbody>
            {summaryData.map((row) => (
              <tr
                key={row.code}
                className="border-t border-border/50 hover:bg-secondary/20"
              >
                <td className="px-4 py-2.5 font-medium text-primary">
                  {row.code}
                </td>
                <td className="px-4 py-2.5">{row.name}</td>
                <td className="px-4 py-2.5 text-right font-mono">
                  {row.opening}
                </td>
                <td className="px-4 py-2.5 text-right font-mono">
                  {row.debit}
                </td>
                <td className="px-4 py-2.5 text-right font-mono">
                  {row.credit}
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold">
                  {row.closing}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-border bg-secondary/30 font-semibold">
              <td className="px-4 py-2.5" colSpan={2}>
                Tổng cộng
              </td>
              <td className="px-4 py-2.5 text-right font-mono">469,700,000</td>
              <td className="px-4 py-2.5 text-right font-mono">730,000,000</td>
              <td className="px-4 py-2.5 text-right font-mono">659,500,000</td>
              <td className="px-4 py-2.5 text-right font-mono">540,200,000</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

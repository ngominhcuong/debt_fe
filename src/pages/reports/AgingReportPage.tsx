import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import PageToolbar from "@/components/shared/PageToolbar";

const agingData = [
  { partner: "Cty ABC", current: 60, d30: 35, d60: 20, d90: 10 },
  { partner: "Cty XYZ", current: 80, d30: 25, d60: 15, d90: 5 },
  { partner: "Cty JKL", current: 20, d30: 30, d60: 10, d90: 15 },
  { partner: "Cty MNO", current: 120, d30: 40, d60: 30, d90: 20 },
  { partner: "Cty PQR", current: 0, d30: 10, d60: 50, d90: 60 },
];

const agingTable = [
  {
    partner: "Cty TNHH ABC",
    total: "125,000,000",
    current: "60,000,000",
    d30: "35,000,000",
    d60: "20,000,000",
    d90: "10,000,000",
  },
  {
    partner: "Cty CP XYZ",
    total: "125,000,000",
    current: "80,000,000",
    d30: "25,000,000",
    d60: "15,000,000",
    d90: "5,000,000",
  },
  {
    partner: "Cty CP JKL",
    total: "75,000,000",
    current: "20,000,000",
    d30: "30,000,000",
    d60: "10,000,000",
    d90: "15,000,000",
  },
  {
    partner: "Cty TNHH MNO",
    total: "210,000,000",
    current: "120,000,000",
    d30: "40,000,000",
    d60: "30,000,000",
    d90: "20,000,000",
  },
  {
    partner: "Cty PQR",
    total: "120,000,000",
    current: "0",
    d30: "10,000,000",
    d60: "50,000,000",
    d90: "60,000,000",
  },
];

export default function AgingReportPage() {
  return (
    <>
      <PageToolbar onExport={() => {}} />

      <div className="bg-card rounded-lg border border-border p-5 mb-4">
        <h3 className="font-semibold text-card-foreground mb-4">
          Biểu đồ tuổi nợ (triệu VNĐ)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={agingData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,88%)" />
            <XAxis dataKey="partner" fontSize={11} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="current"
              stackId="a"
              fill="hsl(215,80%,45%)"
              name="Chưa đến hạn"
            />
            <Bar
              dataKey="d30"
              stackId="a"
              fill="hsl(38,92%,55%)"
              name="1-30 ngày"
            />
            <Bar
              dataKey="d60"
              stackId="a"
              fill="hsl(20,80%,55%)"
              name="31-60 ngày"
            />
            <Bar
              dataKey="d90"
              stackId="a"
              fill="hsl(0,72%,55%)"
              name=">60 ngày"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-4 py-3">Đối tác</th>
              <th className="text-right px-4 py-3">Tổng nợ</th>
              <th className="text-right px-4 py-3">Chưa đến hạn</th>
              <th className="text-right px-4 py-3">1–30 ngày</th>
              <th className="text-right px-4 py-3">31–60 ngày</th>
              <th className="text-right px-4 py-3">&gt;60 ngày</th>
            </tr>
          </thead>
          <tbody>
            {agingTable.map((row) => (
              <tr
                key={row.partner}
                className="border-t border-border/50 hover:bg-secondary/20"
              >
                <td className="px-4 py-2.5">{row.partner}</td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold">
                  {row.total}
                </td>
                <td className="px-4 py-2.5 text-right font-mono">
                  {row.current}
                </td>
                <td className="px-4 py-2.5 text-right font-mono">{row.d30}</td>
                <td className="px-4 py-2.5 text-right font-mono">{row.d60}</td>
                <td className="px-4 py-2.5 text-right font-mono text-destructive">
                  {row.d90}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

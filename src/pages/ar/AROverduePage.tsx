import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";

interface OverdueItem {
  code: string;
  customer: string;
  amount: string;
  due: string;
  overdueDays: number;
  status: "overdue";
}

const data: OverdueItem[] = [
  {
    code: "HD-2026-003",
    customer: "Cty CP JKL",
    amount: "49,500,000",
    due: "17/03/2026",
    overdueDays: 17,
    status: "overdue",
  },
  {
    code: "HD-2025-045",
    customer: "Cty TNHH PQR",
    amount: "120,000,000",
    due: "15/01/2026",
    overdueDays: 78,
    status: "overdue",
  },
  {
    code: "HD-2025-038",
    customer: "Cty STU",
    amount: "85,000,000",
    due: "01/02/2026",
    overdueDays: 61,
    status: "overdue",
  },
];

function getOverdueTextColor(overdueDays: number) {
  if (overdueDays > 60) {
    return "text-destructive";
  }

  if (overdueDays > 30) {
    return "text-warning";
  }

  return "text-foreground";
}

const columns: Column<OverdueItem>[] = [
  { key: "code", header: "Số HĐ", className: "font-medium text-primary" },
  { key: "customer", header: "Khách hàng" },
  {
    key: "amount",
    header: "Số tiền nợ",
    className: "text-right font-mono font-semibold",
  },
  { key: "due", header: "Hạn TT" },
  {
    key: "overdueDays",
    header: "Số ngày quá hạn",
    render: (i) => (
      <span className={`font-semibold ${getOverdueTextColor(i.overdueDays)}`}>
        {i.overdueDays} ngày
      </span>
    ),
  },
  {
    key: "status",
    header: "Trạng thái",
    render: (i) => <StatusBadge status={i.status} />,
  },
  {
    key: "action",
    header: "Thao tác",
    render: () => (
      <div className="flex gap-1">
        <Button variant="outline" size="sm" className="text-xs h-7">
          Nhắc nợ
        </Button>
        <Button variant="outline" size="sm" className="text-xs h-7">
          Thu tiền
        </Button>
      </div>
    ),
  },
];

export default function AROverduePage() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <p className="text-sm text-warning">1–30 ngày</p>
          <p className="text-xl font-bold text-foreground">49,500,000 ₫</p>
          <p className="text-xs text-muted-foreground">1 hóa đơn</p>
        </div>
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <p className="text-sm text-destructive">31–60 ngày</p>
          <p className="text-xl font-bold text-foreground">85,000,000 ₫</p>
          <p className="text-xs text-muted-foreground">1 hóa đơn</p>
        </div>
        <div className="bg-destructive/20 border border-destructive/40 rounded-lg p-4">
          <p className="text-sm text-destructive font-semibold">&gt;60 ngày</p>
          <p className="text-xl font-bold text-foreground">120,000,000 ₫</p>
          <p className="text-xs text-muted-foreground">1 hóa đơn</p>
        </div>
      </div>
      <DataTable columns={columns} data={data} />
    </>
  );
}

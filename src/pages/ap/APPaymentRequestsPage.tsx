import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";

interface PaymentRequest {
  code: string;
  supplier: string;
  amount: string;
  due: string;
  invoice: string;
  requester: string;
  status: "pending" | "approved" | "rejected";
}

const data: PaymentRequest[] = [
  {
    code: "YC-001",
    supplier: "Cty TNHH Vật tư DEF",
    amount: "88,000,000",
    due: "09/04/2026",
    invoice: "HĐV-001",
    requester: "Nguyễn Văn A",
    status: "pending",
  },
  {
    code: "YC-002",
    supplier: "Cty Nguyên liệu GHI",
    amount: "30,000,000",
    due: "14/04/2026",
    invoice: "HĐV-002",
    requester: "Trần Thị B",
    status: "approved",
  },
  {
    code: "YC-003",
    supplier: "Cty Máy móc KLM",
    amount: "320,000,000",
    due: "31/03/2026",
    invoice: "HĐV-003",
    requester: "Nguyễn Văn A",
    status: "rejected",
  },
];

const columns: Column<PaymentRequest>[] = [
  { key: "code", header: "Mã YC", className: "font-medium text-primary" },
  { key: "supplier", header: "Nhà cung cấp" },
  {
    key: "amount",
    header: "Số tiền (VNĐ)",
    className: "text-right font-mono font-semibold",
  },
  { key: "due", header: "Hạn TT" },
  { key: "invoice", header: "HĐ liên quan", className: "text-primary" },
  { key: "requester", header: "Người yêu cầu" },
  {
    key: "status",
    header: "Trạng thái",
    render: (r) => <StatusBadge status={r.status} />,
  },
  {
    key: "action",
    header: "Thao tác",
    render: (r) =>
      r.status === "pending" ? (
        <div className="flex gap-1">
          <Button size="sm" className="text-xs h-7">
            Duyệt
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-7">
            Từ chối
          </Button>
        </div>
      ) : null,
  },
];

export default function APPaymentRequestsPage() {
  return <DataTable columns={columns} data={data} />;
}

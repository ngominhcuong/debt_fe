import PageToolbar from "@/components/shared/PageToolbar";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";

interface Invoice {
  code: string;
  supplier: string;
  date: string;
  total: string;
  due: string;
  status: "paid" | "partial" | "unpaid";
}

const data: Invoice[] = [
  {
    code: "HĐV-001",
    supplier: "Cty TNHH Vật tư DEF",
    date: "10/03/2026",
    total: "88,000,000",
    due: "09/04/2026",
    status: "unpaid",
  },
  {
    code: "HĐV-002",
    supplier: "Cty Nguyên liệu GHI",
    date: "15/03/2026",
    total: "55,000,000",
    due: "14/04/2026",
    status: "partial",
  },
  {
    code: "HĐV-003",
    supplier: "Cty Máy móc KLM",
    date: "01/03/2026",
    total: "320,000,000",
    due: "31/03/2026",
    status: "paid",
  },
];

const columns: Column<Invoice>[] = [
  { key: "code", header: "Số HĐ", className: "font-medium text-primary" },
  { key: "supplier", header: "Nhà cung cấp" },
  { key: "date", header: "Ngày HĐ" },
  {
    key: "total",
    header: "Tổng tiền (VNĐ)",
    className: "text-right font-mono font-semibold",
  },
  { key: "due", header: "Hạn TT" },
  {
    key: "status",
    header: "Trạng thái",
    render: (i) => <StatusBadge status={i.status} />,
  },
];

export default function APInvoicesPage() {
  return (
    <>
      <PageToolbar
        onAdd={() => {}}
        addLabel="Cập nhật HĐ"
        onExport={() => {}}
      />
      <DataTable columns={columns} data={data} onRowClick={() => {}} />
    </>
  );
}

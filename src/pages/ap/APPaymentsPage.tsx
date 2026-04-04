import PageToolbar from "@/components/shared/PageToolbar";
import DataTable, { Column } from "@/components/shared/DataTable";

interface Payment {
  code: string;
  date: string;
  supplier: string;
  amount: string;
  method: string;
  invoice: string;
  note: string;
}

const data: Payment[] = [
  {
    code: "PC-001",
    date: "25/03/2026",
    supplier: "Cty Máy móc KLM",
    amount: "320,000,000",
    method: "Ủy nhiệm chi",
    invoice: "HĐV-003",
    note: "Thanh toán đủ",
  },
  {
    code: "PC-002",
    date: "28/03/2026",
    supplier: "Cty Nguyên liệu GHI",
    amount: "30,000,000",
    method: "Chuyển khoản",
    invoice: "HĐV-002",
    note: "Thanh toán đợt 1",
  },
];

const columns: Column<Payment>[] = [
  { key: "code", header: "Số CT", className: "font-medium text-primary" },
  { key: "date", header: "Ngày chi" },
  { key: "supplier", header: "Nhà cung cấp" },
  {
    key: "amount",
    header: "Số tiền (VNĐ)",
    className: "text-right font-mono font-semibold",
  },
  { key: "method", header: "Hình thức" },
  { key: "invoice", header: "Cấn trừ HĐ", className: "text-primary" },
  { key: "note", header: "Ghi chú" },
];

export default function APPaymentsPage() {
  return (
    <>
      <PageToolbar
        onAdd={() => {}}
        addLabel="Lập phiếu chi"
        onExport={() => {}}
      />
      <DataTable columns={columns} data={data} />
    </>
  );
}

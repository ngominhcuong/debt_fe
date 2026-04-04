import PageToolbar from "@/components/shared/PageToolbar";
import DataTable, { Column } from "@/components/shared/DataTable";

interface Receipt {
  code: string;
  date: string;
  customer: string;
  amount: string;
  method: string;
  invoice: string;
  note: string;
}

const data: Receipt[] = [
  {
    code: "PT-001",
    date: "15/03/2026",
    customer: "Cty TNHH ABC",
    amount: "50,000,000",
    method: "Chuyển khoản",
    invoice: "HD-2026-001",
    note: "Thu đợt 1",
  },
  {
    code: "PT-002",
    date: "18/03/2026",
    customer: "Cty CP XYZ",
    amount: "40,000,000",
    method: "Tiền mặt",
    invoice: "HD-2026-002",
    note: "Thu một phần",
  },
  {
    code: "PT-003",
    date: "20/03/2026",
    customer: "Cty CP JKL",
    amount: "49,500,000",
    method: "Chuyển khoản",
    invoice: "HD-2026-003",
    note: "Thu đủ",
  },
];

const columns: Column<Receipt>[] = [
  { key: "code", header: "Số CT", className: "font-medium text-primary" },
  { key: "date", header: "Ngày thu" },
  { key: "customer", header: "Khách hàng" },
  {
    key: "amount",
    header: "Số tiền (VNĐ)",
    className: "text-right font-mono font-semibold",
  },
  { key: "method", header: "Hình thức" },
  { key: "invoice", header: "Cấn trừ HĐ", className: "text-primary" },
  { key: "note", header: "Ghi chú" },
];

export default function ARReceiptsPage() {
  return (
    <>
      <PageToolbar
        onAdd={() => {}}
        addLabel="Lập phiếu thu"
        onExport={() => {}}
      />
      <DataTable columns={columns} data={data} />
    </>
  );
}

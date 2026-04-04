import PageToolbar from "@/components/shared/PageToolbar";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";

interface Invoice {
  code: string;
  customer: string;
  date: string;
  amount: string;
  vat: string;
  total: string;
  due: string;
  status: "paid" | "partial" | "unpaid";
}

const data: Invoice[] = [
  {
    code: "HD-2026-001",
    customer: "Cty TNHH ABC",
    date: "05/03/2026",
    amount: "100,000,000",
    vat: "10,000,000",
    total: "110,000,000",
    due: "04/04/2026",
    status: "unpaid",
  },
  {
    code: "HD-2026-002",
    customer: "Cty CP XYZ",
    date: "10/03/2026",
    amount: "75,000,000",
    vat: "7,500,000",
    total: "82,500,000",
    due: "09/04/2026",
    status: "partial",
  },
  {
    code: "HD-2026-003",
    customer: "Cty CP JKL",
    date: "15/02/2026",
    amount: "45,000,000",
    vat: "4,500,000",
    total: "49,500,000",
    due: "17/03/2026",
    status: "paid",
  },
  {
    code: "HD-2026-004",
    customer: "Cty TNHH MNO",
    date: "20/03/2026",
    amount: "200,000,000",
    vat: "20,000,000",
    total: "220,000,000",
    due: "19/04/2026",
    status: "unpaid",
  },
];

const columns: Column<Invoice>[] = [
  { key: "code", header: "Số HĐ", className: "font-medium text-primary" },
  { key: "customer", header: "Khách hàng" },
  { key: "date", header: "Ngày HĐ" },
  { key: "amount", header: "Tiền hàng", className: "text-right font-mono" },
  { key: "vat", header: "Thuế GTGT", className: "text-right font-mono" },
  {
    key: "total",
    header: "Tổng cộng",
    className: "text-right font-mono font-semibold",
  },
  { key: "due", header: "Hạn TT" },
  {
    key: "status",
    header: "Trạng thái",
    render: (i) => <StatusBadge status={i.status} />,
  },
];

export default function ARInvoicesPage() {
  return (
    <>
      <PageToolbar
        onAdd={() => {}}
        addLabel="Tạo hóa đơn"
        onExport={() => {}}
      />
      <DataTable columns={columns} data={data} onRowClick={() => {}} />
    </>
  );
}

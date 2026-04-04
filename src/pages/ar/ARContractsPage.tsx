import PageToolbar from "@/components/shared/PageToolbar";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";

interface Contract {
  code: string;
  customer: string;
  value: string;
  startDate: string;
  endDate: string;
  payment: string;
  status: "active" | "inactive";
}

const data: Contract[] = [
  {
    code: "HDB-001",
    customer: "Cty TNHH ABC",
    value: "500,000,000",
    startDate: "01/01/2026",
    endDate: "31/12/2026",
    payment: "30 ngày",
    status: "active",
  },
  {
    code: "HDB-002",
    customer: "Cty CP XYZ",
    value: "350,000,000",
    startDate: "15/02/2026",
    endDate: "15/02/2027",
    payment: "45 ngày",
    status: "active",
  },
  {
    code: "HDB-003",
    customer: "Cty CP JKL",
    value: "180,000,000",
    startDate: "01/06/2025",
    endDate: "31/05/2026",
    payment: "15 ngày",
    status: "inactive",
  },
];

const columns: Column<Contract>[] = [
  { key: "code", header: "Mã HĐ", className: "font-medium text-primary" },
  { key: "customer", header: "Khách hàng" },
  {
    key: "value",
    header: "Giá trị HĐ (VNĐ)",
    className: "text-right font-mono",
  },
  { key: "startDate", header: "Ngày BĐ" },
  { key: "endDate", header: "Ngày KT" },
  { key: "payment", header: "Điều khoản TT" },
  {
    key: "status",
    header: "Trạng thái",
    render: (c) => <StatusBadge status={c.status} />,
  },
];

export default function ARContractsPage() {
  return (
    <>
      <PageToolbar
        onAdd={() => {}}
        addLabel="Thêm hợp đồng"
        onExport={() => {}}
      />
      <DataTable columns={columns} data={data} onRowClick={() => {}} />
    </>
  );
}

import PageToolbar from "@/components/shared/PageToolbar";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";

interface Contract {
  code: string;
  supplier: string;
  value: string;
  startDate: string;
  endDate: string;
  status: "active" | "inactive";
}

const data: Contract[] = [
  {
    code: "HDM-001",
    supplier: "Cty TNHH Vật tư DEF",
    value: "300,000,000",
    startDate: "01/01/2026",
    endDate: "31/12/2026",
    status: "active",
  },
  {
    code: "HDM-002",
    supplier: "Cty Nguyên liệu GHI",
    value: "150,000,000",
    startDate: "01/03/2026",
    endDate: "28/02/2027",
    status: "active",
  },
];

const columns: Column<Contract>[] = [
  { key: "code", header: "Mã HĐ", className: "font-medium text-primary" },
  { key: "supplier", header: "Nhà cung cấp" },
  {
    key: "value",
    header: "Giá trị HĐ (VNĐ)",
    className: "text-right font-mono",
  },
  { key: "startDate", header: "Ngày BĐ" },
  { key: "endDate", header: "Ngày KT" },
  {
    key: "status",
    header: "Trạng thái",
    render: (c) => <StatusBadge status={c.status} />,
  },
];

export default function APContractsPage() {
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

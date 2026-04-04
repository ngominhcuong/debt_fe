import PageToolbar from "@/components/shared/PageToolbar";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Partner {
  code: string;
  name: string;
  type: string;
  taxId: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
}

const data: Partner[] = [
  {
    code: "KH-001",
    name: "Cty TNHH ABC",
    type: "Khách hàng",
    taxId: "0123456789",
    phone: "028-1234-5678",
    email: "abc@company.com",
    status: "active",
  },
  {
    code: "KH-002",
    name: "Cty CP XYZ",
    type: "Khách hàng",
    taxId: "0987654321",
    phone: "024-9876-5432",
    email: "xyz@company.com",
    status: "active",
  },
  {
    code: "NCC-001",
    name: "Cty TNHH Vật tư DEF",
    type: "Nhà cung cấp",
    taxId: "0112233445",
    phone: "028-1122-3344",
    email: "def@supplier.com",
    status: "active",
  },
  {
    code: "NCC-002",
    name: "Cty Nguyên liệu GHI",
    type: "Nhà cung cấp",
    taxId: "0556677889",
    phone: "024-5566-7788",
    email: "ghi@supplier.com",
    status: "inactive",
  },
  {
    code: "KH-003",
    name: "Cty CP Thương mại JKL",
    type: "Khách hàng",
    taxId: "0334455667",
    phone: "028-3344-5566",
    email: "jkl@company.com",
    status: "active",
  },
];

const columns: Column<Partner>[] = [
  { key: "code", header: "Mã", className: "font-medium text-primary w-24" },
  { key: "name", header: "Tên đối tác" },
  {
    key: "type",
    header: "Loại",
    render: (p) => (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${p.type === "Khách hàng" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}
      >
        {p.type}
      </span>
    ),
  },
  { key: "taxId", header: "Mã số thuế", className: "font-mono text-sm" },
  { key: "phone", header: "SĐT" },
  { key: "email", header: "Email" },
  {
    key: "status",
    header: "Trạng thái",
    render: (p) => <StatusBadge status={p.status} />,
  },
];

export default function PartnersPage() {
  return (
    <>
      <PageToolbar
        searchPlaceholder="Tìm theo mã, tên, MST..."
        onAdd={() => {}}
        addLabel="Thêm đối tác"
        onExport={() => {}}
      >
        <Select>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Loại đối tác" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="customer">Khách hàng</SelectItem>
            <SelectItem value="supplier">Nhà cung cấp</SelectItem>
          </SelectContent>
        </Select>
      </PageToolbar>
      <DataTable columns={columns} data={data} onRowClick={() => {}} />
    </>
  );
}

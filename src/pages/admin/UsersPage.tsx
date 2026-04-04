import PageToolbar from "@/components/shared/PageToolbar";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  lastLogin: string;
}

const data: User[] = [
  {
    id: "U001",
    name: "Nguyễn Văn A",
    email: "nguyenvana@company.com",
    role: "Kế toán trưởng",
    status: "active",
    lastLogin: "03/04/2026 08:30",
  },
  {
    id: "U002",
    name: "Trần Thị B",
    email: "tranthib@company.com",
    role: "Kế toán công nợ",
    status: "active",
    lastLogin: "03/04/2026 09:15",
  },
  {
    id: "U003",
    name: "Lê Văn C",
    email: "levanc@company.com",
    role: "Ban Giám đốc",
    status: "active",
    lastLogin: "02/04/2026 14:00",
  },
  {
    id: "U004",
    name: "Phạm Thị D",
    email: "phamthid@company.com",
    role: "Kế toán công nợ",
    status: "inactive",
    lastLogin: "15/03/2026 10:45",
  },
];

const columns: Column<User>[] = [
  { key: "name", header: "Họ tên", className: "font-medium" },
  { key: "email", header: "Email" },
  {
    key: "role",
    header: "Vai trò",
    render: (u) => (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
        {u.role}
      </span>
    ),
  },
  {
    key: "status",
    header: "Trạng thái",
    render: (u) => <StatusBadge status={u.status} />,
  },
  { key: "lastLogin", header: "Đăng nhập cuối" },
  {
    key: "action",
    header: "Thao tác",
    render: () => (
      <Button variant="outline" size="sm" className="text-xs h-7">
        Phân quyền
      </Button>
    ),
  },
];

export default function UsersPage() {
  return (
    <>
      <PageToolbar onAdd={() => {}} addLabel="Thêm người dùng" />
      <DataTable columns={columns} data={data} />
    </>
  );
}

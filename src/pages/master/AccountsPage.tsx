import { ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";

interface Account {
  code: string;
  name: string;
  type: string;
  children?: Account[];
}

const accounts: Account[] = [
  {
    code: "1",
    name: "Tài sản",
    type: "Tổng hợp",
    children: [
      { code: "111", name: "Tiền mặt", type: "Chi tiết" },
      { code: "112", name: "Tiền gửi ngân hàng", type: "Chi tiết" },
      { code: "131", name: "Phải thu khách hàng", type: "Chi tiết" },
      { code: "136", name: "Phải thu khác", type: "Chi tiết" },
      { code: "141", name: "Tạm ứng", type: "Chi tiết" },
      { code: "152", name: "Nguyên vật liệu", type: "Chi tiết" },
      { code: "156", name: "Hàng hóa", type: "Chi tiết" },
    ],
  },
  {
    code: "3",
    name: "Nợ phải trả",
    type: "Tổng hợp",
    children: [
      { code: "331", name: "Phải trả người bán", type: "Chi tiết" },
      { code: "333", name: "Thuế và các khoản phải nộp", type: "Chi tiết" },
      { code: "334", name: "Phải trả người lao động", type: "Chi tiết" },
      { code: "338", name: "Phải trả, phải nộp khác", type: "Chi tiết" },
    ],
  },
  {
    code: "5",
    name: "Doanh thu",
    type: "Tổng hợp",
    children: [
      { code: "511", name: "Doanh thu bán hàng", type: "Chi tiết" },
      { code: "515", name: "Doanh thu tài chính", type: "Chi tiết" },
    ],
  },
  {
    code: "6",
    name: "Chi phí",
    type: "Tổng hợp",
    children: [
      { code: "632", name: "Giá vốn hàng bán", type: "Chi tiết" },
      { code: "641", name: "Chi phí bán hàng", type: "Chi tiết" },
      { code: "642", name: "Chi phí quản lý DN", type: "Chi tiết" },
    ],
  },
];

function AccountRow({
  account,
  level = 0,
}: Readonly<{
  account: Account;
  level?: number;
}>) {
  const [open, setOpen] = useState(true);
  const hasChildren = account.children && account.children.length > 0;

  return (
    <>
      <tr className="border-t border-border/50 hover:bg-secondary/20">
        <td
          className="px-4 py-2.5"
          style={{ paddingLeft: `${16 + level * 24}px` }}
        >
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 font-medium"
          >
            {hasChildren &&
              (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
            <span className="text-primary font-mono">{account.code}</span>
          </button>
        </td>
        <td className="px-4 py-2.5">{account.name}</td>
        <td className="px-4 py-2.5">
          <span
            className={`px-2 py-0.5 rounded text-xs ${hasChildren ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary"}`}
          >
            {account.type}
          </span>
        </td>
      </tr>
      {open &&
        account.children?.map((child) => (
          <AccountRow key={child.code} account={child} level={level + 1} />
        ))}
    </>
  );
}

export default function AccountsPage() {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <th className="text-left px-4 py-3 w-48">Số hiệu TK</th>
            <th className="text-left px-4 py-3">Tên tài khoản</th>
            <th className="text-left px-4 py-3 w-32">Loại</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((acc) => (
            <AccountRow key={acc.code} account={acc} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Database,
  FileText,
  CreditCard,
  Receipt,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Shield,
  Clock,
  LogOut,
  FileCheck,
  AlertTriangle,
  ClipboardList,
  BookOpen,
  TrendingUp,
  Building2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MenuItem {
  label: string;
  path?: string;
  icon: React.ReactNode;
  children?: { label: string; path: string }[];
}

const menuGroups: { title: string; items: MenuItem[] }[] = [
  {
    title: "HỆ THỐNG",
    items: [
      { label: "Dashboard", path: "/", icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    title: "DANH MỤC",
    items: [
      {
        label: "Đối tác",
        icon: <Users size={18} />,
        children: [
          { label: "Danh sách đối tác", path: "/partners" },
          { label: "Thêm đối tác", path: "/partners/new" },
        ],
      },
      {
        label: "Số dư đầu kỳ",
        path: "/opening-balance",
        icon: <Database size={18} />,
      },
      {
        label: "Tài khoản kế toán",
        path: "/accounts",
        icon: <BookOpen size={18} />,
      },
    ],
  },
  {
    title: "CÔNG NỢ PHẢI THU",
    items: [
      {
        label: "Hợp đồng bán",
        path: "/ar/contracts",
        icon: <FileText size={18} />,
      },
      {
        label: "Hóa đơn bán ra",
        path: "/ar/invoices",
        icon: <Receipt size={18} />,
      },
      {
        label: "Thu tiền",
        path: "/ar/receipts",
        icon: <ArrowDownCircle size={18} />,
      },
      {
        label: "Nợ quá hạn",
        path: "/ar/overdue",
        icon: <AlertTriangle size={18} />,
      },
    ],
  },
  {
    title: "CÔNG NỢ PHẢI TRẢ",
    items: [
      {
        label: "Hợp đồng mua",
        path: "/ap/contracts",
        icon: <FileCheck size={18} />,
      },
      {
        label: "Hóa đơn đầu vào",
        path: "/ap/invoices",
        icon: <ClipboardList size={18} />,
      },
      {
        label: "Yêu cầu thanh toán",
        path: "/ap/payment-requests",
        icon: <CreditCard size={18} />,
      },
      {
        label: "Chi tiền",
        path: "/ap/payments",
        icon: <ArrowUpCircle size={18} />,
      },
    ],
  },
  {
    title: "BÁO CÁO",
    items: [
      {
        label: "Đối chiếu công nợ",
        path: "/reports/reconciliation",
        icon: <FileText size={18} />,
      },
      {
        label: "Sổ sách kế toán",
        path: "/reports/ledger",
        icon: <BookOpen size={18} />,
      },
      {
        label: "Báo cáo quản trị",
        path: "/reports/management",
        icon: <BarChart3 size={18} />,
      },
      {
        label: "Phân tích tuổi nợ",
        path: "/reports/aging",
        icon: <TrendingUp size={18} />,
      },
    ],
  },
  {
    title: "QUẢN TRỊ",
    items: [
      { label: "Người dùng", path: "/admin/users", icon: <Shield size={18} /> },
      {
        label: "Nhật ký hệ thống",
        path: "/admin/audit-log",
        icon: <Clock size={18} />,
      },
    ],
  },
];

interface AppSidebarProps {
  collapsed: boolean;
}

export default function AppSidebar({ collapsed }: Readonly<AppSidebarProps>) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loggingOut, setLoggingOut] = useState(false);

  const toggle = (label: string) =>
    setExpanded((p) => ({ ...p, [label]: !p[label] }));

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      await logout();
      toast.success("Đã đăng xuất");
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside
      className={`sidebar-gradient h-screen flex flex-col text-sm shrink-0 sticky top-0 transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div
        className={`h-16 flex items-center border-b border-[hsl(var(--sidebar-border))] transition-all duration-300 ${
          collapsed ? "px-0 justify-center" : "px-5 gap-3"
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Building2 size={18} className="text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden transition-all duration-300 w-28 opacity-100">
            <h1 className="font-bold text-[hsl(var(--sidebar-active-fg))] text-base tracking-tight">
              DebtFlow
            </h1>
            <p className="text-[10px] text-[hsl(var(--sidebar-fg))]">
              Quản lý Công nợ
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
        {menuGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-semibold tracking-widest text-[hsl(var(--sidebar-section))]">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) =>
                item.children ? (
                  <li key={item.label}>
                    <button
                      onClick={() => toggle(item.label)}
                      className={`w-full flex items-center rounded-md text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover))] transition-all duration-300 ${
                        collapsed
                          ? "justify-center px-2 py-2"
                          : "gap-2.5 px-2.5 py-2"
                      }`}
                    >
                      {item.icon}
                      <span
                        className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                          collapsed
                            ? "w-0 opacity-0"
                            : "flex-1 text-left opacity-100"
                        }`}
                      >
                        {item.label}
                      </span>
                      {!collapsed &&
                        (expanded[item.label] ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        ))}
                    </button>
                    {expanded[item.label] && !collapsed && (
                      <ul className="ml-7 mt-0.5 space-y-0.5">
                        {item.children.map((child) => (
                          <li key={child.path}>
                            <NavLink
                              to={child.path}
                              className={`block px-2.5 py-1.5 rounded-md transition-colors ${
                                isActive(child.path)
                                  ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-fg))]"
                                  : "text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover))]"
                              }`}
                            >
                              {child.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ) : (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={`flex items-center rounded-md transition-all duration-300 ${
                        collapsed
                          ? "justify-center px-2 py-2"
                          : "gap-2.5 px-2.5 py-2"
                      } ${
                        isActive(item.path)
                          ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-fg))]"
                          : "text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover))]"
                      }`}
                    >
                      {item.icon}
                      <span
                        className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                          collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                        }`}
                      >
                        {item.label}
                      </span>
                    </NavLink>
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-[hsl(var(--sidebar-border))]">
        <button
          type="button"
          onClick={() => {
            void handleLogout();
          }}
          disabled={loggingOut}
          className={`w-full flex items-center rounded-md text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover))] transition-all duration-300 ${
            collapsed ? "justify-center px-2 py-2" : "gap-2.5 px-2.5 py-2"
          }`}
        >
          <LogOut size={18} />
          <span
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            }`}
          >
            {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
          </span>
        </button>
      </div>
    </aside>
  );
}

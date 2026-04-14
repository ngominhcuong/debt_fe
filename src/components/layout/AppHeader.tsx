import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  HelpCircle,
  Lock,
  LogIn,
  Search,
  User,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_LABELS: Record<string, string> = {
  CHIEF_ACCOUNTANT: "Kế toán trưởng",
  STAFF_ACCOUNTANT: "Kế toán viên",
};

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function AppHeader({
  title,
  subtitle,
  isSidebarCollapsed,
  onToggleSidebar,
}: Readonly<AppHeaderProps>) {
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  const displayName = profile?.fullName ?? profile?.email ?? "Người dùng";
  const roleLabel = profile?.role
    ? (ROLE_LABELS[profile.role] ?? profile.role)
    : "";

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="h-9 w-9 rounded-md border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-300 flex items-center justify-center"
          aria-label={
            isSidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"
          }
        >
          {isSidebarCollapsed ? (
            <ChevronsRight
              size={16}
              className="transition-transform duration-300"
            />
          ) : (
            <ChevronsLeft
              size={16}
              className="transition-transform duration-300"
            />
          )}
        </button>

        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input placeholder="Tìm kiếm..." className="pl-9 w-64 h-9 text-sm" />
        </div>
        <button
          type="button"
          className="p-2 rounded-md hover:bg-secondary transition-colors"
          title="Trợ giúp"
          aria-label="Trợ giúp"
        >
          <HelpCircle size={18} className="text-muted-foreground" />
        </button>
        <button
          type="button"
          className="relative p-2 rounded-md hover:bg-secondary transition-colors"
          title="Thông báo"
          aria-label="Thông báo"
        >
          <Bell size={18} className="text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User size={16} className="text-primary-foreground" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-foreground leading-tight">
                      {displayName}
                    </p>
                    {roleLabel && (
                      <p className="text-[10px] text-muted-foreground">
                        {roleLabel}
                      </p>
                    )}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => navigate("/settings/change-password")}
                  className="cursor-pointer"
                >
                  <Lock size={14} className="mr-2" />
                  Đổi mật khẩu
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <LogIn size={15} />
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

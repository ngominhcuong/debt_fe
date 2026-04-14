import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";

const pageMetaByPath: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Dashboard", subtitle: "Tổng quan công nợ doanh nghiệp" },
  "/partners": {
    title: "Quản lý Đối tác",
    subtitle: "Khách hàng & Nhà cung cấp",
  },
  "/partners/new": {
    title: "Quản lý Đối tác",
    subtitle: "Khách hàng & Nhà cung cấp",
  },
  "/items": {
    title: "Danh mục Mặt hàng",
    subtitle: "Hàng hóa, dịch vụ và vật tư",
  },
  "/items/new": {
    title: "Danh mục Mặt hàng",
    subtitle: "Tạo mới mặt hàng",
  },
  "/opening-balance": {
    title: "Số dư đầu kỳ",
    subtitle: "Cập nhật số dư Nợ/Có đầu kỳ",
  },
  "/accounts": {
    title: "Danh mục Tài khoản Kế toán",
    subtitle: "Hệ thống tài khoản theo TT200",
  },
  "/accounts/new": {
    title: "Danh mục Tài khoản Kế toán",
    subtitle: "Tạo mới tài khoản",
  },
  "/ar/contracts": {
    title: "Hợp đồng bán hàng",
    subtitle: "Quản lý hợp đồng với khách hàng",
  },
  "/ar/invoices": {
    title: "Hóa đơn Bán ra",
    subtitle: "Quản lý hóa đơn bán hàng & dịch vụ",
  },
  "/sales/invoices": {
    title: "Chứng từ Bán hàng",
    subtitle: "Danh sách phiếu xuất & bán hàng",
  },
  "/sales/invoices/new": {
    title: "Chứng từ Bán hàng",
    subtitle: "Tạo phiếu bán hàng mới",
  },
  "/ar/receipts": { title: "Thu tiền", subtitle: "Phiếu thu & Giấy báo Có" },
  "/ar/debts": {
    title: "Công nợ cần thu",
    subtitle: "Sổ chi tiết công nợ phải thu khách hàng",
  },
  "/ar/overdue": {
    title: "Nợ phải thu Quá hạn",
    subtitle: "Danh sách hóa đơn quá hạn thanh toán",
  },
  "/ap/contracts": {
    title: "Hợp đồng mua hàng",
    subtitle: "Quản lý hợp đồng với nhà cung cấp",
  },
  "/ap/invoices": {
    title: "Mua hàng",
    subtitle: "Quản lý chứng từ mua hàng",
  },
  "/ap/invoices/new": {
    title: "Tạo chứng từ mua hàng",
    subtitle: "Nhập thông tin đơn mua hàng mới",
  },
  "/ap/debts": {
    title: "Công nợ phải trả",
    subtitle: "Sổ chi tiết công nợ phải trả nhà cung cấp",
  },
  "/ap/payment-requests": {
    title: "Yêu cầu Thanh toán",
    subtitle: "Phê duyệt các khoản chi tới hạn",
  },
  "/ap/payments": { title: "Chi tiền", subtitle: "Phiếu chi & Ủy nhiệm chi" },
  "/reports/reconciliation": {
    title: "Đối chiếu Công nợ",
    subtitle: "Lập biên bản đối chiếu",
  },
  "/reports/ledger": {
    title: "Sổ sách Kế toán",
    subtitle: "Tra cứu Sổ Cái & Sổ Chi tiết",
  },
  "/reports/management": {
    title: "Báo cáo Tổng hợp Công nợ",
    subtitle: "Tổng hợp phát sinh theo kỳ",
  },
  "/reports/aging": {
    title: "Phân tích Tuổi nợ",
    subtitle: "Aging Report – Phân nhóm nợ theo thời gian",
  },
  "/admin/users": {
    title: "Quản lý Người dùng",
    subtitle: "Tài khoản & phân quyền hệ thống",
  },
  "/admin/audit-log": {
    title: "Nhật ký Hệ thống",
    subtitle: "Lịch sử thao tác người dùng",
  },
  "/settings/change-password": {
    title: "Đổi mật khẩu",
    subtitle: "Cập nhật mật khẩu tài khoản",
  },
  "/settings/invoice-settings": {
    title: "Dải hóa đơn",
    subtitle: "Cấu hình ký hiệu và dải số hóa đơn",
  },
};

function getFallbackPageMeta(pathname: string) {
  if (pathname.startsWith("/partners/")) {
    return {
      title: "Quản lý Đối tác",
      subtitle: "Chi tiết và cập nhật đối tác",
    } as const;
  }

  if (pathname.startsWith("/items/")) {
    return {
      title: "Danh mục Mặt hàng",
      subtitle: "Chi tiết và cập nhật mặt hàng",
    } as const;
  }

  if (pathname.startsWith("/accounts/")) {
    return {
      title: "Danh mục Tài khoản Kế toán",
      subtitle: "Chi tiết và cập nhật tài khoản",
    } as const;
  }

  if (pathname.startsWith("/ap/invoices/")) {
    return {
      title: "Chứng từ mua hàng",
      subtitle: "Chỉnh sửa chứng từ mua hàng",
    } as const;
  }

  return { title: "DebtFlow", subtitle: "Quản lý công nợ" } as const;
}

export default function AppLayout() {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pageMeta =
    pageMetaByPath[location.pathname] ?? getFallbackPageMeta(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar collapsed={isSidebarCollapsed} />
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <AppHeader
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        />
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {location.pathname.startsWith("/sales/") ||
          location.pathname === "/ar/debts" ||
          location.pathname === "/ap/invoices" ||
          location.pathname === "/ap/debts" ? (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <Outlet />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

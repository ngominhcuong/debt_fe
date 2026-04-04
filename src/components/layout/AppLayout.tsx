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
  "/opening-balance": {
    title: "Số dư đầu kỳ",
    subtitle: "Cập nhật số dư Nợ/Có đầu kỳ",
  },
  "/accounts": {
    title: "Danh mục Tài khoản Kế toán",
    subtitle: "Hệ thống tài khoản theo TT200",
  },
  "/ar/contracts": {
    title: "Hợp đồng bán hàng",
    subtitle: "Quản lý hợp đồng với khách hàng",
  },
  "/ar/invoices": {
    title: "Hóa đơn Bán ra",
    subtitle: "Quản lý hóa đơn bán hàng & dịch vụ",
  },
  "/ar/receipts": { title: "Thu tiền", subtitle: "Phiếu thu & Giấy báo Có" },
  "/ar/overdue": {
    title: "Nợ phải thu Quá hạn",
    subtitle: "Danh sách hóa đơn quá hạn thanh toán",
  },
  "/ap/contracts": {
    title: "Hợp đồng mua hàng",
    subtitle: "Quản lý hợp đồng với nhà cung cấp",
  },
  "/ap/invoices": {
    title: "Hóa đơn Đầu vào",
    subtitle: "Quản lý hóa đơn từ nhà cung cấp",
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
};

export default function AppLayout() {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pageMeta =
    pageMetaByPath[location.pathname] ??
    ({ title: "DebtFlow", subtitle: "Quản lý công nợ" } as const);

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
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

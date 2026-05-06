import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api, type DashboardStats } from "@/lib/api";
import KPICard from "@/components/shared/KPICard";
import mwLogo from "@/assets/MWConnect_Logo_1.png";
import coreBanner from "@/assets/Core-Value-Photo-Only.png";
import {
  MapPin,
  Phone,
  Mail,
  FileText,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Shield,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

const highlights = [
  {
    icon: <FileText size={20} className="text-primary" />,
    title: "Quản lý hóa đơn",
    desc: "Theo dõi hóa đơn đầu vào, đầu ra và trạng thái thanh toán theo thời gian thực.",
  },
  {
    icon: <BarChart3 size={20} className="text-primary" />,
    title: "Báo cáo tổng hợp",
    desc: "Báo cáo công nợ phải thu, phải trả, aging report và đối chiếu số liệu.",
  },
  {
    icon: <TrendingUp size={20} className="text-primary" />,
    title: "Phân tích tuổi nợ",
    desc: "Phân nhóm nợ theo thời gian giúp ưu tiên xử lý các khoản nợ quá hạn.",
  },
  {
    icon: <Users size={20} className="text-primary" />,
    title: "Quản lý đối tác",
    desc: "Hồ sơ khách hàng và nhà cung cấp tập trung, tra cứu nhanh chóng.",
  },
  {
    icon: <Clock size={20} className="text-primary" />,
    title: "Nhật ký hệ thống",
    desc: "Ghi lại mọi thao tác của người dùng, đảm bảo kiểm toán minh bạch.",
  },
  {
    icon: <Shield size={20} className="text-primary" />,
    title: "Phân quyền bảo mật",
    desc: "Kế toán trưởng và kế toán viên có quyền hạn riêng biệt, bảo vệ dữ liệu.",
  },
];

function GuestView() {
  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden min-h-[220px] flex items-end shadow-md">
        <img
          src={coreBanner}
          alt="MWConnect"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 p-8 flex items-center gap-6">
          <div className="shrink-0">
            <img src={mwLogo} alt="MWConnect" className="h-16 w-auto" />
          </div>
          <div>
            <p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-1">
              Chào mừng đến với
            </p>
            <h1 className="text-white text-2xl font-bold leading-tight">
              Phần mềm quản lý công nợ
            </h1>
            <h1 className="text-white text-2xl font-bold leading-tight">
              Công ty TNHH MWConnect Việt Nam
            </h1>
          </div>
        </div>
      </div>

      {/* About + contact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-base text-card-foreground">
            Giới thiệu công ty
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">
              Công ty TNHH MWConnect Việt Nam
            </strong>{" "}
            là doanh nghiệp chuyên sản xuất thiết bị điện, máy biến thế và hệ
            thống điều khiển tại KCN Quế Võ III, Bắc Ninh. Thành lập từ cuối năm
            2024, đơn vị tập trung cung cấp các giải pháp kỹ thuật chất lượng
            cao phục vụ nhu cầu hạ tầng công nghiệp hiện đại. Với quy mô vận
            hành chuyên nghiệp, MWConnect hiện là đối tác sản xuất tiềm năng
            trong chuỗi cung ứng thiết bị điện tại khu vực phía Bắc.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Phần mềm quản lý công nợ MWConnect cho phép theo dõi toàn bộ vòng
            đời của hóa đơn — từ lúc phát sinh đến khi thanh toán hoàn tất —
            đồng thời cung cấp báo cáo phân tích tuổi nợ, cảnh báo quá hạn tự
            động và nhật ký kiểm toán đầy đủ.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-base text-card-foreground">
            Thông tin
          </h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
              <span className="text-muted-foreground">Trịnh Thị Huyền</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={16} className="text-primary shrink-0" />
              <span className="text-muted-foreground">Lớp: CQ60/41.04</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={16} className="text-primary shrink-0" />
              <span className="text-muted-foreground">
                Giảng viên hướng dẫn: ThS Hoàng Hải Xanh
              </span>
            </li>
            {/* <li className="flex items-center gap-3">
              <Globe size={16} className="text-primary shrink-0" />
              <span className="text-muted-foreground">www.tth.com.vn</span>
            </li> */}
          </ul>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold text-base text-card-foreground mb-4">
          Tính năng hệ thống
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {highlights.map((f) => (
            <div
              key={f.title}
              className="flex gap-3 p-4 rounded-lg bg-secondary/40 hover:bg-secondary/70 transition-colors"
            >
              <div className="shrink-0 mt-0.5">{f.icon}</div>
              <div>
                <p className="text-sm font-medium text-card-foreground">
                  {f.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function statusBadgeClass(status: string) {
  if (status === "overdue") return "bg-destructive/15 text-destructive";
  if (status === "partial") return "bg-yellow-500/15 text-yellow-600";
  return "bg-muted text-muted-foreground";
}

function statusLabel(status: string) {
  if (status === "overdue") return "Quá hạn";
  if (status === "cancelled") return "Đã hủy";
  return "Chưa TT";
}

function formatVND(amount: number): string {
  if (amount >= 1_000_000_000)
    return `${(amount / 1_000_000_000).toFixed(2)} tỷ`;
  if (amount >= 1_000_000) return `${Math.round(amount / 1_000_000)} tr`;
  return amount.toLocaleString("vi-VN");
}

function AuthenticatedView() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  const { data, isLoading, isError, error } = useQuery<DashboardStats>({
    queryKey: ["dashboard", token],
    queryFn: () => api.report.getDashboard(token).then((r) => r.data),
    enabled: !!token,
    staleTime: 60_000,
  });

  const netAR = (data?.totalAR ?? 0) - (data?.totalAP ?? 0);
  const monthlyData = data?.monthlyData ?? [];
  const arAging = data?.arAging ?? [];
  const recentRows = data?.recentInvoices ?? [];
  const hasAnyData =
    monthlyData.length > 0 ||
    arAging.length > 0 ||
    recentRows.length > 0 ||
    (data?.totalAR ?? 0) > 0 ||
    (data?.totalAP ?? 0) > 0 ||
    (data?.overdueAR ?? 0) > 0;

  return (
    <div className="space-y-6">
      {isError && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm">
          Không tải được dữ liệu Dashboard
          {error instanceof Error ? `: ${error.message}` : ""}
        </div>
      )}

      {!isLoading && !isError && !hasAnyData && (
        <div className="bg-card rounded-lg border border-border px-4 py-6 text-center text-muted-foreground text-sm">
          Chưa có dữ liệu dashboard cho tài khoản hiện tại.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Tổng nợ phải thu"
          value={isLoading ? "..." : formatVND(data?.totalAR ?? 0)}
          change="Tổng dư nợ AR"
          changeType="neutral"
          icon={ArrowDownCircle}
          color="primary"
        />
        <KPICard
          title="Tổng nợ phải trả"
          value={isLoading ? "..." : formatVND(data?.totalAP ?? 0)}
          change="Tổng dư nợ AP"
          changeType="neutral"
          icon={ArrowUpCircle}
          color="info"
        />
        <KPICard
          title="Nợ quá hạn"
          value={isLoading ? "..." : formatVND(data?.overdueAR ?? 0)}
          change={
            isLoading ? "..." : `${data?.overdueARCount ?? 0} hóa đơn quá hạn`
          }
          changeType="neutral"
          icon={AlertTriangle}
          color="destructive"
        />
        <KPICard
          title="Công nợ ròng"
          value={isLoading ? "..." : formatVND(Math.abs(netAR))}
          change={netAR >= 0 ? "Thặng dư thu" : "Thâm hụt thu"}
          changeType={netAR >= 0 ? "up" : "down"}
          icon={netAR >= 0 ? ArrowDownCircle : ArrowUpCircle}
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="font-semibold text-card-foreground mb-4">
            Dòng tiền theo tháng (triệu VNĐ)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,88%)" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="thu"
                stroke="hsl(145,60%,42%)"
                strokeWidth={2}
                name="Thu"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="chi"
                stroke="hsl(0,72%,55%)"
                strokeWidth={2}
                name="Chi"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          {!isLoading && monthlyData.length === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Chưa có dữ liệu dòng tiền.
            </p>
          )}
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="font-semibold text-card-foreground mb-4">
            Phân tích tuổi nợ phải thu (triệu VNĐ)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={arAging}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,88%)" />
              <XAxis dataKey="range" fontSize={11} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar
                dataKey="amount"
                fill="hsl(215,80%,45%)"
                radius={[4, 4, 0, 0]}
                name="Số tiền"
              />
            </BarChart>
          </ResponsiveContainer>
          {!isLoading && arAging.length === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Chưa có dữ liệu tuổi nợ.
            </p>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="font-semibold text-card-foreground mb-4">
          Hóa đơn gần nhất
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2.5 font-medium">Số chứng từ</th>
                <th className="text-left py-2.5 font-medium">Đối tác</th>
                <th className="text-right py-2.5 font-medium">Số tiền (VNĐ)</th>
                <th className="text-left py-2.5 font-medium">Hạn TT</th>
                <th className="text-left py-2.5 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                if (isLoading)
                  return (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-6 text-center text-muted-foreground text-xs"
                      >
                        Đang tải...
                      </td>
                    </tr>
                  );
                if (recentRows.length === 0)
                  return (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-6 text-center text-muted-foreground text-xs"
                      >
                        Chưa có hóa đơn nào
                      </td>
                    </tr>
                  );
                return recentRows.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-border/50 hover:bg-secondary/30"
                  >
                    <td className="py-2.5 font-medium text-primary">
                      {inv.voucherNumber}
                    </td>
                    <td className="py-2.5">{inv.partner}</td>
                    <td className="py-2.5 text-right font-mono">
                      {inv.grandTotal}
                    </td>
                    <td className="py-2.5">
                      {inv.dueDate
                        ? new Date(inv.dueDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass(inv.status)}`}
                      >
                        {statusLabel(inv.status)}
                      </span>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { session } = useAuth();
  return session ? <AuthenticatedView /> : <GuestView />;
}

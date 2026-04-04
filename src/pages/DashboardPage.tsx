import { useAuth } from "@/contexts/AuthContext";
import KPICard from "@/components/shared/KPICard";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Shield,
  Wallet,
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

const cashflowData = [
  { month: "T1", thu: 450, chi: 320 },
  { month: "T2", thu: 520, chi: 410 },
  { month: "T3", thu: 380, chi: 350 },
  { month: "T4", thu: 610, chi: 480 },
  { month: "T5", thu: 550, chi: 390 },
  { month: "T6", thu: 700, chi: 520 },
];

const overdueData = [
  { range: "Chưa đến hạn", amount: 1250 },
  { range: "1-30 ngày", amount: 450 },
  { range: "31-60 ngày", amount: 280 },
  { range: "61-90 ngày", amount: 120 },
  { range: ">90 ngày", amount: 85 },
];

const recentInvoices = [
  {
    id: "HD-001",
    partner: "Cty TNHH ABC",
    amount: "125,000,000",
    due: "15/04/2026",
    status: "unpaid",
  },
  {
    id: "HD-002",
    partner: "Cty CP XYZ",
    amount: "89,500,000",
    due: "20/04/2026",
    status: "partial",
  },
  {
    id: "HD-003",
    partner: "Cty DEF",
    amount: "45,200,000",
    due: "10/03/2026",
    status: "overdue",
  },
  {
    id: "HD-004",
    partner: "Cty GHI Corp",
    amount: "210,000,000",
    due: "25/04/2026",
    status: "unpaid",
  },
];

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
      <div className="relative rounded-2xl overflow-hidden min-h-[220px] flex items-end bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-md">
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute top-10 -right-4 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-8 left-1/3 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10 p-8 flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 shadow-lg">
            <Building2 size={32} className="text-white" />
          </div>
          <div>
            <p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-1">
              Chào mừng đến với
            </p>
            <h1 className="text-white text-2xl font-bold leading-tight">
              Hệ thống Quản lý Công nợ TTH
            </h1>
            <p className="text-white/80 text-sm mt-1.5 max-w-xl">
              Nền tảng quản lý công nợ toàn diện — theo dõi, phân tích và kiểm
              soát dòng tiền doanh nghiệp một cách chính xác, minh bạch.
            </p>
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
            <strong className="text-foreground">Công ty TTH</strong> được thành
            lập với sứ mệnh cung cấp các giải pháp quản lý tài chính và công nợ
            hiệu quả cho doanh nghiệp Việt Nam. Với đội ngũ chuyên gia giàu kinh
            nghiệm trong lĩnh vực kế toán và công nghệ thông tin, chúng tôi
            không ngừng phát triển các công cụ hỗ trợ doanh nghiệp kiểm soát
            dòng tiền, giảm thiểu rủi ro nợ xấu và tối ưu hóa quy trình thu chi.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hệ thống quản lý công nợ TTH cho phép theo dõi toàn bộ vòng đời của
            hóa đơn — từ lúc phát sinh đến khi thanh toán hoàn tất — đồng thời
            cung cấp báo cáo phân tích tuổi nợ, cảnh báo quá hạn tự động và nhật
            ký kiểm toán đầy đủ.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { value: "500+", label: "Doanh nghiệp tin dùng" },
              { value: "99.9%", label: "Uptime hệ thống" },
              { value: "24/7", label: "Hỗ trợ kỹ thuật" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-base text-card-foreground">
            Thông tin liên hệ
          </h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
              <span className="text-muted-foreground">
                123 Đường Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={16} className="text-primary shrink-0" />
              <span className="text-muted-foreground">028 3456 7890</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={16} className="text-primary shrink-0" />
              <span className="text-muted-foreground">contact@tth.com.vn</span>
            </li>
            <li className="flex items-center gap-3">
              <Globe size={16} className="text-primary shrink-0" />
              <span className="text-muted-foreground">www.tth.com.vn</span>
            </li>
          </ul>
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Giờ làm việc:</span>
              <br />
              Thứ 2 – Thứ 6: 8:00 – 17:30
              <br />
              Thứ 7: 8:00 – 12:00
            </p>
          </div>
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
  if (status === "partial") return "TT 1 phần";
  return "Chưa TT";
}

function AuthenticatedView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Tổng nợ phải thu"
          value="2.85 tỷ"
          change="+12% so tháng trước"
          changeType="up"
          icon={ArrowDownCircle}
          color="primary"
        />
        <KPICard
          title="Tổng nợ phải trả"
          value="1.92 tỷ"
          change="-5% so tháng trước"
          changeType="down"
          icon={ArrowUpCircle}
          color="info"
        />
        <KPICard
          title="Nợ quá hạn"
          value="485 tr"
          change="8 hóa đơn"
          changeType="neutral"
          icon={AlertTriangle}
          color="destructive"
        />
        <KPICard
          title="Thu ròng tháng này"
          value="780 tr"
          change="+18% so tháng trước"
          changeType="up"
          icon={Wallet}
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="font-semibold text-card-foreground mb-4">
            Dòng tiền theo tháng (triệu VNĐ)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={cashflowData}>
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
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="font-semibold text-card-foreground mb-4">
            Phân tích tuổi nợ phải thu (triệu VNĐ)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={overdueData}>
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
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="font-semibold text-card-foreground mb-4">
          Hóa đơn sắp đến hạn
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2.5 font-medium">Mã HĐ</th>
                <th className="text-left py-2.5 font-medium">Đối tác</th>
                <th className="text-right py-2.5 font-medium">Số tiền (VNĐ)</th>
                <th className="text-left py-2.5 font-medium">Hạn TT</th>
                <th className="text-left py-2.5 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-border/50 hover:bg-secondary/30"
                >
                  <td className="py-2.5 font-medium text-primary">{inv.id}</td>
                  <td className="py-2.5">{inv.partner}</td>
                  <td className="py-2.5 text-right font-mono">{inv.amount}</td>
                  <td className="py-2.5">{inv.due}</td>
                  <td className="py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass(inv.status)}`}
                    >
                      {statusLabel(inv.status)}
                    </span>
                  </td>
                </tr>
              ))}
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

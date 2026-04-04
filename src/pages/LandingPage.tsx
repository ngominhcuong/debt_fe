import { Link } from "react-router-dom";
import {
  Building2,
  BarChart3,
  FileText,
  Shield,
  ArrowRight,
  TrendingUp,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: <FileText size={22} className="text-primary" />,
    title: "Quản lý hóa đơn",
    desc: "Theo dõi hóa đơn đầu vào, đầu ra và trạng thái thanh toán theo thời gian thực.",
  },
  {
    icon: <BarChart3 size={22} className="text-primary" />,
    title: "Báo cáo tổng hợp",
    desc: "Báo cáo công nợ phải thu, phải trả, aging report và đối chiếu số liệu.",
  },
  {
    icon: <TrendingUp size={22} className="text-primary" />,
    title: "Phân tích tuổi nợ",
    desc: "Phân nhóm nợ theo thời gian giúp ưu tiên xử lý các khoản nợ quá hạn.",
  },
  {
    icon: <Users size={22} className="text-primary" />,
    title: "Quản lý đối tác",
    desc: "Hồ sơ khách hàng và nhà cung cấp tập trung, tra cứu nhanh chóng.",
  },
  {
    icon: <Clock size={22} className="text-primary" />,
    title: "Nhật ký hệ thống",
    desc: "Ghi lại mọi thao tác của người dùng, đảm bảo kiểm toán minh bạch.",
  },
  {
    icon: <Shield size={22} className="text-primary" />,
    title: "Phân quyền bảo mật",
    desc: "Kế toán trưởng và kế toán viên có quyền hạn riêng biệt, bảo vệ dữ liệu.",
  },
];

const stats = [
  { value: "99.9%", label: "Uptime" },
  { value: "500+", label: "Doanh nghiệp" },
  { value: "24/7", label: "Hỗ trợ" },
  { value: "100%", label: "Trực tuyến" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 size={16} className="text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground text-base">
            Quản lý Công nợ
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Đăng nhập
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Đăng ký</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-20 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6">
            <Building2 size={12} />
            Hệ thống Quản lý Công nợ Doanh nghiệp
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
            Kiểm soát công nợ{" "}
            <span className="text-primary">chính xác & kịp thời</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Theo dõi công nợ phải thu, phải trả, quản lý hợp đồng và hóa đơn —
            tất cả trong một nền tảng tập trung, an toàn.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Bắt đầu miễn phí <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Đăng nhập hệ thống
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/30 py-10 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            Tính năng nổi bật
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">
                  {f.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Hệ thống Quản lý Công nợ Doanh nghiệp. All
        rights reserved.
      </footer>
    </div>
  );
}

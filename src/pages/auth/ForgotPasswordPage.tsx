import { useState } from "react";
import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const redirectTo = `${globalThis.location.origin}/auth/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw new Error(error.message);
      setSent(true);
      toast.success("Email đặt lại mật khẩu đã được gửi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gửi yêu cầu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/8 blur-3xl pointer-events-none" />

      {/* Top-left logo */}
      <Link
        to="/"
        className="absolute top-5 left-5 w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
        aria-label="Trang chủ"
      >
        <Building2 size={20} className="text-primary-foreground" />
      </Link>

      <div className="relative w-full max-w-sm">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Quên mật khẩu
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {sent
                ? "Kiểm tra email để nhận link đặt lại mật khẩu"
                : "Nhập email để nhận link đặt lại mật khẩu"}
            </p>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Link đặt lại mật khẩu đã được gửi tới{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Vui lòng kiểm tra hộp thư (kể cả Spam).
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSent(false)}
              >
                Gửi lại
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">
                  Quay lại đăng nhập
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@company.com"
                  className="mt-1.5"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Đang gửi..." : "Gửi yêu cầu"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">
                  Quay lại đăng nhập
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

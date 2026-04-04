import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

type PageState = "waiting" | "ready" | "error";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>("waiting");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const markReady = () => {
      if (!mounted || readyRef.current) return;
      readyRef.current = true;
      setPageState("ready");
      if (timeoutId) clearTimeout(timeoutId);
    };

    const markError = () => {
      if (!mounted || readyRef.current) return;
      setPageState("error");
    };

    // Listen for auth events – cover both:
    //  • PASSWORD_RECOVERY: fires when SDK exchanges the code AFTER we subscribed
    //  • INITIAL_SESSION w/ session: fires immediately if SDK already has the session
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (
        event === "PASSWORD_RECOVERY" ||
        (event === "INITIAL_SESSION" && currentSession)
      ) {
        markReady();
      }
    });

    // Fallback: session might already exist if SDK processed the URL before we subscribed
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session) markReady();
      })
      .catch(() => {
        /* ignore */
      });

    // Timeout: if nothing resolves in 12s the link is truly invalid / expired
    timeoutId = setTimeout(markError, 12000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw new Error(error.message);

      toast.success("Đặt lại mật khẩu thành công");
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Đặt lại mật khẩu thất bại",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Building2 size={24} className="text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Đặt lại mật khẩu
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Nhập mật khẩu mới cho tài khoản của bạn
          </p>
        </div>

        {pageState === "waiting" && (
          <div className="text-center text-sm text-muted-foreground py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Đang xác minh liên kết...
          </div>
        )}

        {pageState === "error" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center text-sm text-destructive">
              Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
            </div>
            <a href="/forgot-password">
              <Button variant="outline" className="w-full">
                Gửi lại yêu cầu
              </Button>
            </a>
            <p className="text-center text-sm text-muted-foreground">
              <a href="/login" className="text-primary hover:underline">
                Quay lại đăng nhập
              </a>
            </p>
          </div>
        )}

        {pageState === "ready" && (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <div className="relative mt-1.5">
                <Input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  placeholder="Tối thiểu 8 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
              <div className="relative mt-1.5">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Đang lưu..." : "Đặt lại mật khẩu"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <a href="/login" className="text-primary hover:underline">
                Quay lại đăng nhập
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

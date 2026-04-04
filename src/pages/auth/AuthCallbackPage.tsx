import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const handle = async () => {
      const searchParams = new URLSearchParams(globalThis.location.search);
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (errorParam) {
        await supabase.auth.signOut({ scope: "local" });
        setError(errorDescription ?? errorParam);
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      // With detectSessionInUrl=true + PKCE, Supabase SDK handles code exchange automatically.
      // We only need to wait for session to appear and then navigate home.
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        toast.success("Đăng nhập thành công");
        navigate("/", { replace: true });
        return;
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, currentSession) => {
        if (event === "SIGNED_IN" && currentSession) {
          subscription.unsubscribe();
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          toast.success("Đăng nhập thành công");
          navigate("/", { replace: true });
        }
      });

      timeoutId = setTimeout(() => {
        subscription.unsubscribe();
        setError("Không thể hoàn tất đăng nhập Google. Vui lòng thử lại.");
        navigate("/login", { replace: true });
      }, 5000);
    };

    void handle();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-5">
          <Building2 size={28} className="text-primary-foreground" />
        </div>
        {error ? (
          <>
            <p className="font-semibold text-destructive">Đăng nhập thất bại</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Đang chuyển hướng về trang đăng nhập...
            </p>
          </>
        ) : (
          <>
            <p className="font-medium text-foreground">
              Đang hoàn tất đăng nhập...
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Vui lòng chờ trong giây lát
            </p>
          </>
        )}
      </div>
    </div>
  );
}

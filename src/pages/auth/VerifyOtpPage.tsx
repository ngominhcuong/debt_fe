import { useState } from "react";
import { Building2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";

export default function VerifyOtpPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setError(null);
    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });

      if (verifyError) throw verifyError;

      // Session is stored by Supabase SDK; onAuthStateChange fires → profile synced
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendSuccess(false);
    setError(null);
    try {
      await api.auth.resendOtp({ email });
      setResendSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 sidebar-gradient items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6">
            <Building2 size={32} className="text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-[hsl(0,0%,100%)] mb-3">
            DebtFlow
          </h1>
          <p className="text-[hsl(220,15%,65%)] text-lg">
            Xác thực email của bạn để hoàn tất đăng ký
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              Xác thực email
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Nhập mã 6 chữ số đã được gửi đến{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="mb-3 block">Mã xác thực (OTP)</Label>
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                pattern={REGEXP_ONLY_DIGITS}
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {resendSuccess && (
              <p className="text-sm text-green-600">
                Đã gửi lại mã thành công!
              </p>
            )}

            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={otp.length !== 6 || loading}
            >
              {loading ? "Đang xác thực..." : "Xác nhận"}
            </Button>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="flex items-center gap-1.5 text-primary hover:underline disabled:opacity-50"
              >
                <RotateCcw size={14} />
                {resending ? "Đang gửi..." : "Gửi lại mã"}
              </button>
              <Link to="/login" className="hover:underline">
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

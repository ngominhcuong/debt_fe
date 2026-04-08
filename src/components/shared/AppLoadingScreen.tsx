import { Building2 } from "lucide-react";

interface AppLoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export default function AppLoadingScreen({
  message = "Đang tải dữ liệu...",
  subMessage,
}: Readonly<AppLoadingScreenProps>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Building2 size={24} className="text-primary-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">{message}</p>
        {subMessage && (
          <p className="text-xs text-muted-foreground mt-1">{subMessage}</p>
        )}
      </div>
    </div>
  );
}

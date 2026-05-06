import mwLogo from "@/assets/MWConnect_Logo_1.png";

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
        <div className="mx-auto mb-4 animate-pulse">
          <img src={mwLogo} alt="MWConnect" className="h-12 w-auto mx-auto" />
        </div>
        <p className="text-sm font-medium text-foreground">{message}</p>
        {subMessage && (
          <p className="text-xs text-muted-foreground mt-1">{subMessage}</p>
        )}
      </div>
    </div>
  );
}

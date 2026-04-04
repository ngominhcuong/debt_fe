import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: LucideIcon;
  color: "primary" | "success" | "warning" | "destructive" | "info";
}

const colorMap = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

export default function KPICard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  color,
}: KPICardProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold text-card-foreground">{value}</p>
          {change && (
            <p
              className={`text-xs mt-1 ${changeType === "up" ? "text-success" : changeType === "down" ? "text-destructive" : "text-muted-foreground"}`}
            >
              {change}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

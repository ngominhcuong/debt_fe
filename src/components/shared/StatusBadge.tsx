import { Badge } from "@/components/ui/badge";

type Status =
  | "paid"
  | "partial"
  | "unpaid"
  | "overdue"
  | "active"
  | "inactive"
  | "pending"
  | "approved"
  | "rejected";

const statusConfig: Record<Status, { label: string; className: string }> = {
  paid: {
    label: "Đã TT",
    className: "bg-success/15 text-success border-success/30",
  },
  partial: {
    label: "TT 1 phần",
    className: "bg-warning/15 text-warning border-warning/30",
  },
  unpaid: {
    label: "Chưa TT",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
  overdue: {
    label: "Quá hạn",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
  active: {
    label: "Hiệu lực",
    className: "bg-success/15 text-success border-success/30",
  },
  inactive: {
    label: "Hết hiệu lực",
    className: "bg-muted text-muted-foreground border-border",
  },
  pending: {
    label: "Chờ duyệt",
    className: "bg-warning/15 text-warning border-warning/30",
  },
  approved: {
    label: "Đã duyệt",
    className: "bg-success/15 text-success border-success/30",
  },
  rejected: {
    label: "Từ chối",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

export default function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status];
  return (
    <Badge variant="outline" className={`text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}

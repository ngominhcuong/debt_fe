import PageToolbar from "@/components/shared/PageToolbar";

const logs = [
  {
    time: "03/04/2026 09:15:32",
    user: "Trần Thị B",
    action: "Thêm mới",
    target: "Hóa đơn HD-2026-005",
    detail: "Tạo hóa đơn bán hàng cho Cty ABC",
  },
  {
    time: "03/04/2026 08:45:10",
    user: "Nguyễn Văn A",
    action: "Phê duyệt",
    target: "YC thanh toán YC-001",
    detail: "Duyệt chi 88,000,000 VNĐ",
  },
  {
    time: "02/04/2026 16:30:55",
    user: "Trần Thị B",
    action: "Cập nhật",
    target: "Đối tác KH-002",
    detail: "Sửa SĐT, Email",
  },
  {
    time: "02/04/2026 14:20:18",
    user: "Lê Văn C",
    action: "Xem",
    target: "Báo cáo tuổi nợ",
    detail: "Xuất Excel báo cáo Q1/2026",
  },
  {
    time: "02/04/2026 10:05:42",
    user: "Nguyễn Văn A",
    action: "Xóa",
    target: "Phiếu thu PT-temp",
    detail: "Xóa phiếu thu nháp",
  },
];

const actionColors: Record<string, string> = {
  "Thêm mới": "bg-success/15 text-success",
  "Cập nhật": "bg-info/15 text-info",
  "Phê duyệt": "bg-primary/15 text-primary",
  Xóa: "bg-destructive/15 text-destructive",
  Xem: "bg-muted text-muted-foreground",
};

export default function AuditLogPage() {
  return (
    <>
      <PageToolbar onExport={() => {}} />
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-4 py-3">Thời gian</th>
              <th className="text-left px-4 py-3">Người dùng</th>
              <th className="text-left px-4 py-3">Hành động</th>
              <th className="text-left px-4 py-3">Đối tượng</th>
              <th className="text-left px-4 py-3">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={`${log.time}-${log.action}-${log.target}`}
                className="border-t border-border/50 hover:bg-secondary/20"
              >
                <td className="px-4 py-2.5 font-mono text-xs">{log.time}</td>
                <td className="px-4 py-2.5 font-medium">{log.user}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${actionColors[log.action] || ""}`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-primary">{log.target}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {log.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

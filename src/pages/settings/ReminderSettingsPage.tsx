import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  api,
  type GlobalReminderSettings,
  type ReminderLog,
  type UpdateGlobalReminderPayload,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, Play, RefreshCw, Save, XCircle } from "lucide-react";

interface ScheduleForm {
  reminderEnabled: boolean;
  reminderHour: string;
  reminderMinute: string;
  defaultDaysBeforeDue: string;
  defaultDaysAfterDue: string;
}

export default function ReminderSettingsPage() {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? "";

  const [settings, setSettings] = useState<GlobalReminderSettings | null>(null);
  const [form, setForm] = useState<ScheduleForm>({
    reminderEnabled: true,
    reminderHour: "8",
    reminderMinute: "0",
    defaultDaysBeforeDue: "2",
    defaultDaysAfterDue: "1",
  });
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<{
    sent: number;
    skipped: number;
    errors: number;
    details: { partnerCode: string; result: string }[];
  } | null>(null);

  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await api.reminderConfig.getSettings(accessToken);
      const s = res.data;
      setSettings(s);
      setForm({
        reminderEnabled: s.reminderEnabled,
        reminderHour: String(s.reminderHour),
        reminderMinute: String(s.reminderMinute),
        defaultDaysBeforeDue: String(s.defaultDaysBeforeDue),
        defaultDaysAfterDue: String(s.defaultDaysAfterDue),
      });
    } catch {
      toast.error("Không tải được cấu hình lịch nhắc");
    } finally {
      setLoadingSettings(false);
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.reminderConfig.getLogs(accessToken, 100);
      setLogs(res.data ?? []);
    } catch {
      toast.error("Không tải được nhật ký nhắc nợ");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    loadSettings();
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleSave = async () => {
    const hour = parseInt(form.reminderHour, 10);
    const minute = parseInt(form.reminderMinute, 10);
    const daysBeforeDue = parseInt(form.defaultDaysBeforeDue, 10);
    const daysAfterDue = parseInt(form.defaultDaysAfterDue, 10);

    if (isNaN(hour) || hour < 0 || hour > 23) {
      toast.error("Giờ nhắc phải từ 0 đến 23");
      return;
    }
    if (isNaN(minute) || minute < 0 || minute > 59) {
      toast.error("Phút nhắc phải từ 0 đến 59");
      return;
    }
    if (isNaN(daysBeforeDue) || daysBeforeDue < 0) {
      toast.error("Số ngày nhắc trước hạn không hợp lệ");
      return;
    }
    if (isNaN(daysAfterDue) || daysAfterDue < 0) {
      toast.error("Số ngày nhắc sau hạn không hợp lệ");
      return;
    }

    setSaving(true);
    try {
      const payload: UpdateGlobalReminderPayload = {
        reminderEnabled: form.reminderEnabled,
        reminderHour: hour,
        reminderMinute: minute,
        defaultDaysBeforeDue: daysBeforeDue,
        defaultDaysAfterDue: daysAfterDue,
      };
      const res = await api.reminderConfig.updateSettings(payload, accessToken);
      setSettings(res.data);
      toast.success("Đã lưu cấu hình lịch nhắc nợ");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không lưu được cấu hình",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await api.reminderConfig.runNow(accessToken);
      const data = res.data;
      setRunResult(data);
      if ((data?.errors ?? 0) > 0) {
        toast.warning(
          `Hoàn thành: ${data?.sent ?? 0} gửi, ${data?.skipped ?? 0} bỏ qua, ${data?.errors ?? 0} lỗi`,
        );
      } else {
        toast.success(
          `Hoàn thành: ${data?.sent ?? 0} gửi thành công, ${data?.skipped ?? 0} bỏ qua`,
        );
      }
      await loadLogs();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không chạy được lịch nhắc",
      );
    } finally {
      setRunning(false);
    }
  };

  const statusVariant = (
    status: string,
  ): "default" | "destructive" | "secondary" => {
    if (status === "SENT") return "default";
    if (status === "FAILED") return "destructive";
    return "secondary";
  };

  // Hour options 0-23, minute options every 5 min
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Lịch nhắc nợ tự động</h1>
        <p className="text-sm text-muted-foreground">
          Cấu hình thời gian và ngưỡng gửi email nhắc nợ tự động cho toàn hệ
          thống
        </p>
      </div>

      {/* ── Schedule config card ── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Cấu hình lịch chạy</CardTitle>
          <CardDescription>
            Thay đổi sẽ có hiệu lực ngay lập tức, không cần khởi động lại
            server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loadingSettings ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : (
            <>
              {/* Enabled toggle */}
              <div className="rounded-lg border p-4 flex items-center justify-between gap-3 bg-muted/20">
                <div>
                  <p className="text-sm font-medium">Bật tự động nhắc nợ</p>
                  <p className="text-xs text-muted-foreground">
                    Khi tắt, hệ thống sẽ không gửi bất kỳ email nhắc nợ tự động
                    nào
                  </p>
                </div>
                <Switch
                  checked={form.reminderEnabled}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, reminderEnabled: v }))
                  }
                />
              </div>

              <Separator />

              {/* Time picker */}
              <div>
                <p className="text-sm font-semibold mb-3">
                  Thời gian gửi hàng ngày
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Giờ (0–23)</Label>
                    <Select
                      value={form.reminderHour}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, reminderHour: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {hourOptions.map((h) => (
                          <SelectItem key={h} value={String(h)}>
                            {String(h).padStart(2, "0")}h
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Phút</Label>
                    <Select
                      value={form.reminderMinute}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, reminderMinute: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {minuteOptions.map((m) => (
                          <SelectItem key={m} value={String(m)}>
                            :{String(m).padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    {settings && (
                      <div className="rounded-md bg-muted px-3 py-2 text-sm">
                        Hiện tại:{" "}
                        <span className="font-mono font-semibold">
                          {settings.description}
                        </span>
                        {" · "}
                        <span className="text-muted-foreground text-xs">
                          cron: <code>{settings.cronSchedule}</code>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Default days */}
              <div>
                <p className="text-sm font-semibold mb-3">
                  Ngưỡng nhắc mặc định{" "}
                  <span className="text-muted-foreground font-normal text-xs">
                    (áp dụng khi đối tác chưa có cấu hình riêng)
                  </span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nhắc trước khi đến hạn (ngày)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={365}
                      value={form.defaultDaysBeforeDue}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          defaultDaysBeforeDue: e.target.value,
                        }))
                      }
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Gửi email khi hóa đơn còn x ngày đến hạn
                    </p>
                  </div>
                  <div>
                    <Label>Nhắc sau khi quá hạn (ngày)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={365}
                      value={form.defaultDaysAfterDue}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          defaultDaysAfterDue: e.target.value,
                        }))
                      }
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Gửi email khi hóa đơn đã quá hạn ít nhất x ngày
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  <Save size={14} className="mr-1.5" />
                  {saving ? "Đang lưu..." : "Lưu cấu hình"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRunNow}
                  disabled={running}
                >
                  <Play size={14} className="mr-1.5" />
                  {running ? "Đang chạy..." : "Chạy ngay"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadSettings}
                  disabled={loadingSettings}
                  className="ml-auto"
                >
                  <RefreshCw size={14} className="mr-1.5" />
                  Làm mới
                </Button>
              </div>

              {/* Run result panel */}
              {runResult && (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                      <CheckCircle2 size={15} />
                      {runResult.sent} gửi thành công
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      {runResult.skipped} bỏ qua
                    </div>
                    {runResult.errors > 0 && (
                      <div className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                        <XCircle size={15} />
                        {runResult.errors} lỗi
                      </div>
                    )}
                  </div>
                  {runResult.details.length > 0 && (
                    <div className="rounded border bg-background text-xs divide-y max-h-48 overflow-y-auto">
                      {runResult.details.map((d, i) => {
                        const isSent = d.result.startsWith("sent");
                        const isError = d.result.startsWith("error");
                        return (
                          <div
                            key={i}
                            className="flex items-start gap-2 px-3 py-2"
                          >
                            {isSent ? (
                              <CheckCircle2
                                size={12}
                                className="mt-0.5 shrink-0 text-green-500"
                              />
                            ) : isError ? (
                              <XCircle
                                size={12}
                                className="mt-0.5 shrink-0 text-destructive"
                              />
                            ) : (
                              <span className="mt-0.5 shrink-0 w-3 h-3 rounded-full bg-muted-foreground/30" />
                            )}
                            <span className="font-mono text-muted-foreground mr-1">
                              {d.partnerCode}
                            </span>
                            <span className={isError ? "text-destructive" : ""}>
                              {d.result}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Logs card ── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Nhật ký gửi email nhắc nợ
              </CardTitle>
              <CardDescription>100 lần gửi gần nhất</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadLogs}
              disabled={loadingLogs}
            >
              <RefreshCw size={14} className="mr-1.5" />
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Chưa có lịch sử gửi email nhắc nợ
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Đối tác</TableHead>
                    <TableHead>Phạm vi</TableHead>
                    <TableHead>Email nhận</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Lỗi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {log.sentAt
                          ? new Date(log.sentAt).toLocaleString("vi-VN")
                          : new Date(log.createdAt).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="text-sm">{log.partner?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {log.partner?.code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.scope}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.recipientEmail}
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate">
                        {log.subject}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant(log.status)}
                          className="text-xs"
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-destructive max-w-xs truncate">
                        {log.errorMessage ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

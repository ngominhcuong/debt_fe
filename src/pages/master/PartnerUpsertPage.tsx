import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  api,
  type PartnerPayload,
  type ReminderConfigPayload,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import PageDataLoading from "@/components/shared/PageDataLoading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface FormState {
  code: string;
  name: string;
  partnerType: "CUSTOMER" | "SUPPLIER" | "BOTH";
  taxCode: string;
  phone: string;
  email: string;
  address: string;
  paymentTermDays: string;
  creditLimit: string;
  isActive: boolean;
  debtReminderOn: boolean;
  reminderEmail: string;
  reminderCcEmails: string;
}

const initialState: FormState = {
  code: "",
  name: "",
  partnerType: "BOTH",
  taxCode: "",
  phone: "",
  email: "",
  address: "",
  paymentTermDays: "",
  creditLimit: "",
  isActive: true,
  debtReminderOn: true,
  reminderEmail: "",
  reminderCcEmails: "",
};

interface ReminderConfigState {
  enabled: boolean;
  scope: "AR" | "AP" | "BOTH";
  daysBeforeDue: string;
  daysAfterDue: string;
  recipientEmail: string;
  ccEmails: string;
}

const initialReminderConfig: ReminderConfigState = {
  enabled: true,
  scope: "BOTH",
  daysBeforeDue: "2",
  daysAfterDue: "1",
  recipientEmail: "",
  ccEmails: "",
};

export default function PartnerUpsertPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { session } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialState);
  const [reminderConfig, setReminderConfig] = useState<ReminderConfigState>(
    initialReminderConfig,
  );
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const accessToken = session?.access_token;
    if (!isEdit || !id || !accessToken) {
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const res = await api.master.getPartner(id, accessToken);
        const p = res.data;
        setForm({
          code: p.code,
          name: p.name,
          partnerType: p.partnerType,
          taxCode: p.taxCode ?? "",
          phone: p.phone ?? "",
          email: p.email ?? "",
          address: p.address ?? "",
          paymentTermDays: p.paymentTermDays ? String(p.paymentTermDays) : "",
          creditLimit: p.creditLimit ?? "",
          isActive: p.isActive,
          debtReminderOn: p.debtReminderOn,
          reminderEmail: p.reminderEmail ?? "",
          reminderCcEmails: p.reminderCcEmails?.join(",") ?? "",
        });

        // Load per-partner reminder schedule config
        try {
          const cfgRes = await api.reminderConfig.get(id, accessToken);
          const cfg = cfgRes.data?.[0];
          if (cfg) {
            setReminderConfig({
              enabled: cfg.enabled,
              scope: cfg.scope,
              daysBeforeDue: String(cfg.daysBeforeDue),
              daysAfterDue: String(cfg.daysAfterDue),
              recipientEmail: cfg.recipientEmail ?? "",
              ccEmails: cfg.ccEmails?.join(",") ?? "",
            });
          }
        } catch {
          // Config might not exist yet — that's fine
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không tải được dữ liệu đối tác",
        );
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [id, isEdit, session?.access_token]);

  const payload = useMemo<PartnerPayload>(() => {
    const basePayload: PartnerPayload = {
      name: form.name.trim(),
      partnerType: form.partnerType,
      taxCode: form.taxCode.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      paymentTermDays: form.paymentTermDays
        ? Number(form.paymentTermDays)
        : undefined,
      creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
      isActive: form.isActive,
      debtReminderOn: form.debtReminderOn,
      reminderEmail: form.reminderEmail.trim() || undefined,
      reminderCcEmails: form.reminderCcEmails
        ? form.reminderCcEmails
            .split(",")
            .map((email) => email.trim())
            .filter(Boolean)
        : undefined,
    };

    if (isEdit) {
      basePayload.code = form.code.trim();
    }

    return basePayload;
  }, [form, isEdit]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const accessToken = session?.access_token;
    if (!accessToken) {
      toast.error("Phiên đăng nhập hết hạn");
      return;
    }

    setSubmitting(true);
    try {
      let partnerId = id;
      if (isEdit && id) {
        await api.master.updatePartner(id, payload, accessToken);
        toast.success("Cập nhật đối tác thành công");
      } else {
        const created = await api.master.createPartner(payload, accessToken);
        partnerId = created.data.id;
        toast.success("Tạo đối tác thành công");
      }

      // Save reminder config (best-effort)
      if (partnerId) {
        const reminderPayload: ReminderConfigPayload = {
          scope: reminderConfig.scope,
          enabled: reminderConfig.enabled,
          daysBeforeDue: reminderConfig.daysBeforeDue
            ? parseInt(reminderConfig.daysBeforeDue, 10)
            : 3,
          daysAfterDue: reminderConfig.daysAfterDue
            ? parseInt(reminderConfig.daysAfterDue, 10)
            : 1,
          recipientEmail: reminderConfig.recipientEmail.trim() || null,
          ccEmails: reminderConfig.ccEmails
            ? reminderConfig.ccEmails
                .split(",")
                .map((e) => e.trim())
                .filter(Boolean)
            : [],
        };
        await api.reminderConfig.upsert(
          partnerId,
          reminderPayload,
          accessToken,
        );
      }

      navigate(isEdit ? `/partners/${id}` : `/partners/${partnerId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không lưu được đối tác",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageDataLoading variant="form" />;
  }

  let submitLabel = "Tạo mới";
  if (isEdit) {
    submitLabel = "Lưu thay đổi";
  }
  if (submitting) {
    submitLabel = "Đang lưu...";
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-5xl">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">
            {isEdit ? "Cập nhật đối tác" : "Tạo đối tác mới"}
          </CardTitle>
          <CardDescription>
            {isEdit
              ? "Chỉnh sửa thông tin đối tác và chính sách công nợ"
              : "Mã đối tác sẽ được hệ thống tự động cấp theo loại đối tác"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isEdit && (
              <div>
                <Label>Mã đối tác</Label>
                <Input value={form.code} readOnly className="bg-muted/40" />
              </div>
            )}
            <div>
              <Label>Tên đối tác</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label>Loại đối tác</Label>
              <Select
                value={form.partnerType}
                onValueChange={(value) =>
                  setForm((p) => ({
                    ...p,
                    partnerType: value as FormState["partnerType"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOMER">Khách hàng</SelectItem>
                  <SelectItem value="SUPPLIER">Nhà cung cấp</SelectItem>
                  <SelectItem value="BOTH">Cả hai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mã số thuế</Label>
              <Input
                value={form.taxCode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, taxCode: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Điện thoại</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Hạn thanh toán (ngày)</Label>
              <Input
                type="number"
                min={0}
                value={form.paymentTermDays}
                onChange={(e) =>
                  setForm((p) => ({ ...p, paymentTermDays: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Hạn mức công nợ</Label>
              <Input
                type="number"
                min={0}
                value={form.creditLimit}
                onChange={(e) =>
                  setForm((p) => ({ ...p, creditLimit: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <Label>Địa chỉ</Label>
            <Input
              value={form.address}
              onChange={(e) =>
                setForm((p) => ({ ...p, address: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Email nhắc nợ</Label>
              <Input
                type="email"
                value={form.reminderEmail}
                onChange={(e) =>
                  setForm((p) => ({ ...p, reminderEmail: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>CC email nhắc nợ (tách bởi dấu phẩy)</Label>
              <Input
                value={form.reminderCcEmails}
                onChange={(e) =>
                  setForm((p) => ({ ...p, reminderCcEmails: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-border p-4 bg-muted/20">
            <div className="flex items-center justify-between gap-3">
              <Label>Kích hoạt đối tác</Label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(value) =>
                  setForm((p) => ({ ...p, isActive: value }))
                }
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label>Bật nhắc nợ email</Label>
              <Switch
                checked={form.debtReminderOn}
                onCheckedChange={(value) =>
                  setForm((p) => ({ ...p, debtReminderOn: value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Reminder schedule config ──────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Lịch nhắc nợ tự động</CardTitle>
          <CardDescription>
            Hệ thống sẽ tự động gửi email nhắc nợ cho đối tác này theo lịch đã
            cấu hình.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Phạm vi nhắc</Label>
              <Select
                value={reminderConfig.scope}
                onValueChange={(v) =>
                  setReminderConfig((p) => ({
                    ...p,
                    scope: v as "AR" | "AP" | "BOTH",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AR">Chỉ công nợ phải thu (AR)</SelectItem>
                  <SelectItem value="AP">Chỉ công nợ phải trả (AP)</SelectItem>
                  <SelectItem value="BOTH">Cả hai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nhắc trước hạn (ngày)</Label>
              <Input
                type="number"
                min={0}
                max={365}
                value={reminderConfig.daysBeforeDue}
                onChange={(e) =>
                  setReminderConfig((p) => ({
                    ...p,
                    daysBeforeDue: e.target.value,
                  }))
                }
                placeholder="3"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Gửi nhắc khi hóa đơn còn x ngày đến hạn
              </p>
            </div>
            <div>
              <Label>Nhắc sau quá hạn (ngày)</Label>
              <Input
                type="number"
                min={0}
                max={365}
                value={reminderConfig.daysAfterDue}
                onChange={(e) =>
                  setReminderConfig((p) => ({
                    ...p,
                    daysAfterDue: e.target.value,
                  }))
                }
                placeholder="1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Gửi nhắc khi hóa đơn quá hạn ít nhất x ngày
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Email nhắc nợ (ghi đè mặc định)</Label>
              <Input
                type="email"
                value={reminderConfig.recipientEmail}
                onChange={(e) =>
                  setReminderConfig((p) => ({
                    ...p,
                    recipientEmail: e.target.value,
                  }))
                }
                placeholder="Để trống để dùng email mặc định của đối tác"
              />
            </div>
            <div>
              <Label>CC email (tách bởi dấu phẩy)</Label>
              <Input
                value={reminderConfig.ccEmails}
                onChange={(e) =>
                  setReminderConfig((p) => ({ ...p, ccEmails: e.target.value }))
                }
                placeholder="email1@..., email2@..."
              />
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-muted/20 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Bật lịch nhắc tự động</p>
              <p className="text-xs text-muted-foreground">
                Khi tắt, đối tác này sẽ không nhận email nhắc nợ tự động
              </p>
            </div>
            <Switch
              checked={reminderConfig.enabled}
              onCheckedChange={(v) =>
                setReminderConfig((p) => ({ ...p, enabled: v }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Hủy
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

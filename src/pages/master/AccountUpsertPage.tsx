import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api, type Account, type AccountPayload } from "@/lib/api";
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
import { Switch } from "@/components/ui/switch";

interface FormState {
  code: string;
  name: string;
  accountType:
    | "ASSET"
    | "LIABILITY"
    | "EQUITY"
    | "REVENUE"
    | "EXPENSE"
    | "OFF_BALANCE";
  normalBalance: "DEBIT" | "CREDIT";
  parentId: string;
  isPosting: boolean;
  allowManualEntry: boolean;
  isActive: boolean;
  sortOrder: string;
  description: string;
}

const initialState: FormState = {
  code: "",
  name: "",
  accountType: "ASSET",
  normalBalance: "DEBIT",
  parentId: "",
  isPosting: true,
  allowManualEntry: true,
  isActive: true,
  sortOrder: "0",
  description: "",
};

export default function AccountUpsertPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { session } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialState);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const accessToken = session?.access_token;
    if (!accessToken) {
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const accountRes = await api.master.listAccounts(accessToken, {
          isActive: true,
        });
        setAccounts(accountRes.data);

        if (isEdit && id) {
          const res = await api.master.getAccount(id, accessToken);
          const a = res.data;
          setForm({
            code: a.code,
            name: a.name,
            accountType: a.accountType,
            normalBalance: a.normalBalance,
            parentId: a.parentId ?? "",
            isPosting: a.isPosting,
            allowManualEntry: a.allowManualEntry,
            isActive: a.isActive,
            sortOrder: String(a.sortOrder),
            description: a.description ?? "",
          });
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không tải được dữ liệu tài khoản",
        );
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [id, isEdit, session?.access_token]);

  const payload = useMemo<AccountPayload>(
    () => ({
      code: form.code.trim(),
      name: form.name.trim(),
      accountType: form.accountType,
      normalBalance: form.normalBalance,
      parentId: form.parentId || null,
      isPosting: form.isPosting,
      allowManualEntry: form.allowManualEntry,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder || 0),
      description: form.description.trim() || undefined,
    }),
    [form],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const accessToken = session?.access_token;
    if (!accessToken) {
      toast.error("Phiên đăng nhập hết hạn");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && id) {
        await api.master.updateAccount(id, payload, accessToken);
        toast.success("Cập nhật tài khoản thành công");
        navigate(`/accounts/${id}`);
      } else {
        const created = await api.master.createAccount(payload, accessToken);
        toast.success("Tạo tài khoản thành công");
        navigate(`/accounts/${created.data.id}`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không lưu được tài khoản",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageDataLoading variant="form" />;
  }

  return (
    <form onSubmit={onSubmit} className="max-w-4xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEdit ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}
          </CardTitle>
          <CardDescription>
            Cập nhật thông tin định danh, phân loại và quy tắc hạch toán cho tài
            khoản.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Số hiệu TK</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((p) => ({ ...p, code: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label>Tên tài khoản</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label>Tính chất tài khoản</Label>
              <Select
                value={form.accountType}
                onValueChange={(value) =>
                  setForm((p) => ({
                    ...p,
                    accountType: value as FormState["accountType"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASSET">Tài sản</SelectItem>
                  <SelectItem value="LIABILITY">Nợ phải trả</SelectItem>
                  <SelectItem value="EQUITY">Vốn chủ sở hữu</SelectItem>
                  <SelectItem value="REVENUE">Doanh thu</SelectItem>
                  <SelectItem value="EXPENSE">Chi phí</SelectItem>
                  <SelectItem value="OFF_BALANCE">Ngoài bảng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dư tính</Label>
              <Select
                value={form.normalBalance}
                onValueChange={(value) =>
                  setForm((p) => ({
                    ...p,
                    normalBalance: value as FormState["normalBalance"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBIT">Nợ</SelectItem>
                  <SelectItem value="CREDIT">Có</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tài khoản cha</Label>
              <Select
                value={form.parentId || "none"}
                onValueChange={(value) =>
                  setForm((p) => ({
                    ...p,
                    parentId: value === "none" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Không có" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có</SelectItem>
                  {accounts
                    .filter((account) => account.id !== id)
                    .map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Thứ tự hiển thị</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((p) => ({ ...p, sortOrder: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <Label>Mô tả</Label>
            <Input
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cấu hình sử dụng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isPosting}
                onCheckedChange={(value) =>
                  setForm((p) => ({ ...p, isPosting: value }))
                }
              />
              <Label>Là tài khoản chi tiết</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.allowManualEntry}
                onCheckedChange={(value) =>
                  setForm((p) => ({ ...p, allowManualEntry: value }))
                }
              />
              <Label>Cho phép nhập tay</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(value) =>
                  setForm((p) => ({ ...p, isActive: value }))
                }
              />
              <Label>Kích hoạt</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo mới"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

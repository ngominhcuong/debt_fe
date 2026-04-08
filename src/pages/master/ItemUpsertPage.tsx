import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api, type Account, type ItemPayload } from "@/lib/api";
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
  sku: string;
  name: string;
  itemType: "GOODS" | "SERVICE" | "MATERIAL" | "OTHER";
  unit: string;
  salePrice: string;
  purchasePrice: string;
  vatRate: string;
  revenueAccountId: string;
  cogsAccountId: string;
  inventoryAccountId: string;
  isTrackedInventory: boolean;
  isActive: boolean;
  description: string;
}

const initialState: FormState = {
  sku: "",
  name: "",
  itemType: "GOODS",
  unit: "",
  salePrice: "",
  purchasePrice: "",
  vatRate: "",
  revenueAccountId: "",
  cogsAccountId: "",
  inventoryAccountId: "",
  isTrackedInventory: false,
  isActive: true,
  description: "",
};

export default function ItemUpsertPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { session } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialState);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

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
          const itemRes = await api.master.getItem(id, accessToken);
          const item = itemRes.data;
          setForm({
            sku: item.sku,
            name: item.name,
            itemType: item.itemType,
            unit: item.unit,
            salePrice: item.salePrice ?? "",
            purchasePrice: item.purchasePrice ?? "",
            vatRate: item.vatRate ?? "",
            revenueAccountId: item.revenueAccountId ?? "",
            cogsAccountId: item.cogsAccountId ?? "",
            inventoryAccountId: item.inventoryAccountId ?? "",
            isTrackedInventory: item.isTrackedInventory,
            isActive: item.isActive,
            description: item.description ?? "",
          });
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không tải được dữ liệu mặt hàng",
        );
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [id, isEdit, session?.access_token]);

  const payload = useMemo<ItemPayload>(() => {
    const basePayload: ItemPayload = {
      name: form.name.trim(),
      itemType: form.itemType,
      unit: form.unit.trim(),
      salePrice: form.salePrice ? Number(form.salePrice) : undefined,
      purchasePrice: form.purchasePrice
        ? Number(form.purchasePrice)
        : undefined,
      vatRate: form.vatRate ? Number(form.vatRate) : undefined,
      revenueAccountId: form.revenueAccountId || null,
      cogsAccountId: form.cogsAccountId || null,
      inventoryAccountId: form.inventoryAccountId || null,
      isTrackedInventory: form.isTrackedInventory,
      isActive: form.isActive,
      description: form.description.trim() || undefined,
    };

    if (isEdit) {
      basePayload.sku = form.sku.trim();
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
      if (isEdit && id) {
        await api.master.updateItem(id, payload, accessToken);
        toast.success("Cập nhật mặt hàng thành công");
        navigate(`/items/${id}`);
      } else {
        const created = await api.master.createItem(payload, accessToken);
        toast.success("Tạo mặt hàng thành công");
        navigate(`/items/${created.data.id}`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không lưu được mặt hàng",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageDataLoading variant="form" />;
  }

  const revenueAccounts = accounts.filter(
    (account) => account.accountType === "REVENUE",
  );
  const cogsAccounts = accounts.filter(
    (account) => account.accountType === "EXPENSE",
  );
  const inventoryAccounts = accounts.filter(
    (account) => account.accountType === "ASSET",
  );

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
            {isEdit ? "Cập nhật mặt hàng" : "Tạo mặt hàng mới"}
          </CardTitle>
          <CardDescription>
            {isEdit
              ? "Điều chỉnh thông tin bán hàng, giá vốn và hạch toán"
              : "Mã mặt hàng sẽ được hệ thống tự động cấp theo mẫu MH00001"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isEdit && (
              <div>
                <Label>Mã hàng</Label>
                <Input value={form.sku} readOnly className="bg-muted/40" />
              </div>
            )}
            <div>
              <Label>Tên mặt hàng</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label>Loại mặt hàng</Label>
              <Select
                value={form.itemType}
                onValueChange={(value) =>
                  setForm((p) => ({
                    ...p,
                    itemType: value as FormState["itemType"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOODS">Hàng hóa</SelectItem>
                  <SelectItem value="SERVICE">Dịch vụ</SelectItem>
                  <SelectItem value="MATERIAL">Nguyên vật liệu</SelectItem>
                  <SelectItem value="OTHER">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Đơn vị tính</Label>
              <Input
                value={form.unit}
                onChange={(e) =>
                  setForm((p) => ({ ...p, unit: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label>Giá bán</Label>
              <Input
                type="number"
                min={0}
                value={form.salePrice}
                onChange={(e) =>
                  setForm((p) => ({ ...p, salePrice: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Giá mua</Label>
              <Input
                type="number"
                min={0}
                value={form.purchasePrice}
                onChange={(e) =>
                  setForm((p) => ({ ...p, purchasePrice: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>VAT (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.vatRate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, vatRate: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>TK doanh thu</Label>
              <Select
                value={form.revenueAccountId || "none"}
                onValueChange={(value) =>
                  setForm((p) => ({
                    ...p,
                    revenueAccountId: value === "none" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tài khoản" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không chọn</SelectItem>
                  {revenueAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>TK giá vốn</Label>
              <Select
                value={form.cogsAccountId || "none"}
                onValueChange={(value) =>
                  setForm((p) => ({
                    ...p,
                    cogsAccountId: value === "none" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tài khoản" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không chọn</SelectItem>
                  {cogsAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>TK tồn kho</Label>
              <Select
                value={form.inventoryAccountId || "none"}
                onValueChange={(value) =>
                  setForm((p) => ({
                    ...p,
                    inventoryAccountId: value === "none" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tài khoản" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không chọn</SelectItem>
                  {inventoryAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-border p-4 bg-muted/20">
            <div className="flex items-center justify-between gap-3">
              <Label>Theo dõi tồn kho</Label>
              <Switch
                checked={form.isTrackedInventory}
                onCheckedChange={(value) =>
                  setForm((p) => ({ ...p, isTrackedInventory: value }))
                }
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label>Kích hoạt mặt hàng</Label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(value) =>
                  setForm((p) => ({ ...p, isActive: value }))
                }
              />
            </div>
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

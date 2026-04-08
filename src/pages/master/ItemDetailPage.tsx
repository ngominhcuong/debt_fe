import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api, type Item } from "@/lib/api";
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
import { formatCurrencyVnd } from "@/lib/utils";
import { ITEM_TYPE_LABEL } from "./catalog-constants";

function InfoRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 py-2.5 border-b border-border/50 text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="md:col-span-2 font-medium">{value || "-"}</p>
    </div>
  );
}

export default function ItemDetailPage() {
  const { id } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const accessToken = session?.access_token;
    if (!accessToken || !id) {
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const res = await api.master.getItem(id, accessToken);
        setItem(res.data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không tải được chi tiết mặt hàng");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [id, session?.access_token]);

  if (loading) {
    return <PageDataLoading variant="detail" />;
  }

  if (!item) {
    return <p className="text-sm text-muted-foreground">Không có dữ liệu mặt hàng.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate("/items")}>Quay lại</Button>
        <Button onClick={() => navigate(`/items/${item.id}/edit`)}>Chỉnh sửa</Button>
      </div>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">{item.name}</CardTitle>
          <CardDescription>Mã hàng: {item.sku}</CardDescription>
        </CardHeader>
        <CardContent>
          <InfoRow label="Loại" value={ITEM_TYPE_LABEL[item.itemType] ?? item.itemType} />
          <InfoRow label="DVT" value={item.unit} />
          <InfoRow label="Giá bán" value={formatCurrencyVnd(item.salePrice)} />
          <InfoRow label="Giá mua" value={formatCurrencyVnd(item.purchasePrice)} />
          <InfoRow label="VAT (%)" value={item.vatRate ?? "-"} />
          <InfoRow label="TK doanh thu" value={item.revenueAccount ? `${item.revenueAccount.code} - ${item.revenueAccount.name}` : "-"} />
          <InfoRow label="TK giá vốn" value={item.cogsAccount ? `${item.cogsAccount.code} - ${item.cogsAccount.name}` : "-"} />
          <InfoRow label="TK tồn kho" value={item.inventoryAccount ? `${item.inventoryAccount.code} - ${item.inventoryAccount.name}` : "-"} />
          <InfoRow label="Theo dõi tồn" value={item.isTrackedInventory ? "Có" : "Không"} />
        </CardContent>
      </Card>
    </div>
  );
}

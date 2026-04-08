import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, type Item } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DataTable, { type Column } from "@/components/shared/DataTable";
import PageToolbar from "@/components/shared/PageToolbar";
import PageDataLoading from "@/components/shared/PageDataLoading";
import { Button } from "@/components/ui/button";
import { formatCurrencyVnd } from "@/lib/utils";
import { ITEM_TYPE_LABEL } from "./catalog-constants";

export default function ItemsPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const accessToken = session?.access_token;
    if (!accessToken) {
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const res = await api.master.listItems(accessToken);
        setItems(res.data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể tải danh mục mặt hàng");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [session?.access_token]);

  const columns = useMemo<Column<Item>[]>(
    () => [
      { key: "sku", header: "Mã hàng", className: "font-medium text-primary" },
      { key: "name", header: "Tên mặt hàng" },
      {
        key: "itemType",
        header: "Loại",
        render: (item) => ITEM_TYPE_LABEL[item.itemType] ?? item.itemType,
      },
      { key: "unit", header: "DVT" },
      {
        key: "salePrice",
        header: "Giá bán",
        render: (item) => formatCurrencyVnd(item.salePrice),
      },
      {
        key: "isActive",
        header: "Trạng thái",
        render: (item) => (item.isActive ? "Đang hoạt động" : "Ngừng"),
      },
      {
        key: "actions",
        header: "Thao tác",
        render: (item) => (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/items/${item.id}`)}
            >
              Chi tiết
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/items/${item.id}/edit`)}
            >
              Chỉnh sửa
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  return (
    <>
      <PageToolbar
        searchPlaceholder="Tìm theo mã, tên mặt hàng..."
        onAdd={() => navigate("/items/new")}
        addLabel="Tạo mặt hàng"
      />
      {loading && items.length === 0 ? (
        <PageDataLoading variant="table" />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          onRowClick={(item) => navigate(`/items/${item.id}`)}
        />
      )}
    </>
  );
}

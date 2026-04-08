import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, type Partner } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DataTable, { type Column } from "@/components/shared/DataTable";
import PageToolbar from "@/components/shared/PageToolbar";
import PageDataLoading from "@/components/shared/PageDataLoading";
import { Button } from "@/components/ui/button";
import { PARTNER_TYPE_LABEL } from "./catalog-constants";

export default function PartnersPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    const accessToken = session?.access_token;
    if (!accessToken) {
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const res = await api.master.listPartners(accessToken);
        setPartners(res.data);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách đối tác",
        );
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [session?.access_token]);

  const columns = useMemo<Column<Partner>[]>(
    () => [
      { key: "code", header: "Mã", className: "font-medium text-primary" },
      { key: "name", header: "Tên đối tác" },
      {
        key: "partnerType",
        header: "Loại",
        render: (item) =>
          PARTNER_TYPE_LABEL[item.partnerType] ?? item.partnerType,
      },
      { key: "taxCode", header: "Mã số thuế" },
      { key: "phone", header: "Điện thoại" },
      { key: "email", header: "Email" },
      {
        key: "isActive",
        header: "Trạng thái",
        render: (item) => (item.isActive ? "Đang hoạt động" : "Ngừng"),
      },
      {
        key: "actions",
        header: "Thao tác",
        render: (item) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/partners/${item.id}`);
              }}
            >
              Chi tiết
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/partners/${item.id}/edit`);
              }}
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
        searchPlaceholder="Tìm theo mã, tên, MST..."
        onAdd={() => navigate("/partners/new")}
        addLabel="Tạo đối tác"
      />
      {loading && partners.length === 0 ? (
        <PageDataLoading variant="table" />
      ) : (
        <DataTable
          columns={columns}
          data={partners}
          onRowClick={(item) => navigate(`/partners/${item.id}`)}
        />
      )}
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, type Account } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DataTable, { type Column } from "@/components/shared/DataTable";
import PageToolbar from "@/components/shared/PageToolbar";
import PageDataLoading from "@/components/shared/PageDataLoading";
import { Button } from "@/components/ui/button";
import { ACCOUNT_TYPE_LABEL, NORMAL_BALANCE_LABEL } from "./catalog-constants";

export default function AccountsPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const accessToken = session?.access_token;
    if (!accessToken) {
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const res = await api.master.listAccounts(accessToken);
        setAccounts(res.data);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách tài khoản",
        );
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [session?.access_token]);

  const columns = useMemo<Column<Account>[]>(
    () => [
      {
        key: "code",
        header: "Số hiệu TK",
        className: "font-medium text-primary",
      },
      { key: "name", header: "Tên tài khoản" },
      {
        key: "accountType",
        header: "Tính chất",
        render: (item) =>
          ACCOUNT_TYPE_LABEL[item.accountType] ?? item.accountType,
      },
      {
        key: "normalBalance",
        header: "Dư tính",
        render: (item) =>
          NORMAL_BALANCE_LABEL[item.normalBalance] ?? item.normalBalance,
      },
      {
        key: "parent",
        header: "TK cha",
        render: (item) =>
          item.parent ? `${item.parent.code} - ${item.parent.name}` : "-",
      },
      {
        key: "isPosting",
        header: "Hạch toán",
        render: (item) => (item.isPosting ? "Chi tiết" : "Tổng hợp"),
      },
      {
        key: "actions",
        header: "Thao tác",
        render: (item) => (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/accounts/${item.id}`)}
            >
              Chi tiết
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/accounts/${item.id}/edit`)}
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
        searchPlaceholder="Tìm theo số hiệu, tên tài khoản..."
        onAdd={() => navigate("/accounts/new")}
        addLabel="Tạo tài khoản"
      />
      {loading && accounts.length === 0 ? (
        <PageDataLoading variant="table" />
      ) : (
        <DataTable
          columns={columns}
          data={accounts}
          onRowClick={(item) => navigate(`/accounts/${item.id}`)}
        />
      )}
    </>
  );
}

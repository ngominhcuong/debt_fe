import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api, type Account } from "@/lib/api";
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
import { ACCOUNT_TYPE_LABEL, NORMAL_BALANCE_LABEL } from "./catalog-constants";

function InfoRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 py-2.5 border-b border-border/50 text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="md:col-span-2 font-medium">{value || "-"}</p>
    </div>
  );
}

export default function AccountDetailPage() {
  const { id } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const accessToken = session?.access_token;
    if (!accessToken || !id) {
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const res = await api.master.getAccount(id, accessToken);
        setAccount(res.data);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không tải được chi tiết tài khoản",
        );
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [id, session?.access_token]);

  if (loading) {
    return <PageDataLoading variant="detail" />;
  }

  if (!account) {
    return (
      <p className="text-sm text-muted-foreground">
        Không có dữ liệu tài khoản.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate("/accounts")}>
          Quay lại
        </Button>
        <Button onClick={() => navigate(`/accounts/${account.id}/edit`)}>
          Chỉnh sửa
        </Button>
      </div>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">{account.name}</CardTitle>
          <CardDescription>Số hiệu tài khoản: {account.code}</CardDescription>
        </CardHeader>
        <CardContent>
          <InfoRow
            label="Tính chất"
            value={
              ACCOUNT_TYPE_LABEL[account.accountType] ?? account.accountType
            }
          />
          <InfoRow
            label="Dư tính"
            value={
              NORMAL_BALANCE_LABEL[account.normalBalance] ??
              account.normalBalance
            }
          />
          <InfoRow label="Cấp" value={String(account.level)} />
          <InfoRow
            label="Tài khoản cha"
            value={
              account.parent
                ? `${account.parent.code} - ${account.parent.name}`
                : "-"
            }
          />
          <InfoRow
            label="Loại TK"
            value={account.isPosting ? "Chi tiết" : "Tổng hợp"}
          />
          <InfoRow
            label="Nhập tay"
            value={account.allowManualEntry ? "Cho phép" : "Không"}
          />
          <InfoRow
            label="Trạng thái"
            value={account.isActive ? "Đang hoạt động" : "Ngừng"}
          />
        </CardContent>
      </Card>
    </div>
  );
}

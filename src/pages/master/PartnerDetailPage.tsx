import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api, type Partner } from "@/lib/api";
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
import { PARTNER_TYPE_LABEL } from "./catalog-constants";

function InfoRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 py-2.5 border-b border-border/50 text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="md:col-span-2 font-medium">{value || "-"}</p>
    </div>
  );
}

export default function PartnerDetailPage() {
  const { id } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const accessToken = session?.access_token;
    if (!accessToken || !id) {
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const res = await api.master.getPartner(id, accessToken);
        setPartner(res.data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không tải được chi tiết đối tác");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [id, session?.access_token]);

  if (loading) {
    return <PageDataLoading variant="detail" />;
  }

  if (!partner) {
    return <p className="text-sm text-muted-foreground">Không có dữ liệu đối tác.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate("/partners")}>
          Quay lại
        </Button>
        <Button onClick={() => navigate(`/partners/${partner.id}/edit`)}>Chỉnh sửa</Button>
      </div>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">{partner.name}</CardTitle>
          <CardDescription>Mã đối tác: {partner.code}</CardDescription>
        </CardHeader>
        <CardContent>
          <InfoRow label="Loại" value={PARTNER_TYPE_LABEL[partner.partnerType] ?? partner.partnerType} />
          <InfoRow label="MST" value={partner.taxCode ?? "-"} />
          <InfoRow label="Điện thoại" value={partner.phone ?? "-"} />
          <InfoRow label="Email" value={partner.email ?? "-"} />
          <InfoRow label="Địa chỉ" value={partner.address ?? "-"} />
          <InfoRow label="Hạn thanh toán (ngày)" value={String(partner.paymentTermDays ?? "-")} />
          <InfoRow label="Hạn mức công nợ" value={formatCurrencyVnd(partner.creditLimit)} />
          <InfoRow label="Nhắc nợ email" value={partner.debtReminderOn ? "Bật" : "Tắt"} />
          <InfoRow label="Email nhắc nợ" value={partner.reminderEmail ?? "-"} />
        </CardContent>
      </Card>
    </div>
  );
}

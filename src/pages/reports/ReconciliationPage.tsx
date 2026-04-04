import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, FileText, CheckCircle } from "lucide-react";

export default function ReconciliationPage() {
  return (
    <div className="bg-card rounded-lg border border-border p-6 max-w-3xl">
      <h3 className="font-semibold text-foreground mb-4">
        Thông tin đối chiếu
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <Label>Đối tác</Label>
          <Select>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Chọn đối tác" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kh1">Cty TNHH ABC</SelectItem>
              <SelectItem value="kh2">Cty CP XYZ</SelectItem>
              <SelectItem value="ncc1">Cty TNHH Vật tư DEF</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tài khoản</Label>
          <Select>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Chọn TK" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="131">131 - Phải thu KH</SelectItem>
              <SelectItem value="331">331 - Phải trả NCC</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Từ ngày</Label>
          <Input type="date" className="mt-1.5" />
        </div>
        <div>
          <Label>Đến ngày</Label>
          <Input type="date" className="mt-1.5" />
        </div>
      </div>
      <Button className="mr-2">Lập biên bản</Button>

      <div className="mt-8 border-t border-border pt-6">
        <h3 className="font-semibold text-foreground mb-4">
          Kết quả đối chiếu
        </h3>
        <div className="bg-secondary/30 rounded-lg p-5 text-sm space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dư đầu kỳ:</span>
            <span className="font-mono font-semibold">125,000,000 ₫</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phát sinh Nợ:</span>
            <span className="font-mono font-semibold">350,000,000 ₫</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phát sinh Có:</span>
            <span className="font-mono font-semibold">280,000,000 ₫</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3">
            <span className="font-semibold">Dư cuối kỳ:</span>
            <span className="font-mono font-bold text-primary">
              195,000,000 ₫
            </span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm">
            <Download size={14} className="mr-1.5" /> Xuất PDF
          </Button>
          <Button variant="outline" size="sm">
            <FileText size={14} className="mr-1.5" /> Xuất Excel
          </Button>
          <Button size="sm">
            <CheckCircle size={14} className="mr-1.5" /> Đã xác nhận
          </Button>
        </div>
      </div>
    </div>
  );
}

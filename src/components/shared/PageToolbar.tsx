import { Search, Plus, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PageToolbarProps {
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  onExport?: () => void;
  onImport?: () => void;
  children?: React.ReactNode;
}

export default function PageToolbar({
  searchPlaceholder = "Tìm kiếm...",
  onAdd,
  addLabel = "Thêm mới",
  onExport,
  onImport,
  children,
}: PageToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input placeholder={searchPlaceholder} className="pl-9 h-9 text-sm" />
      </div>
      {children}
      <div className="flex items-center gap-2 ml-auto">
        {onImport && (
          <Button variant="outline" size="sm" onClick={onImport}>
            <Upload size={14} className="mr-1.5" /> Import
          </Button>
        )}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download size={14} className="mr-1.5" /> Xuất Excel
          </Button>
        )}
        {onAdd && (
          <Button size="sm" onClick={onAdd}>
            <Plus size={14} className="mr-1.5" /> {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

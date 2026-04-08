import { Skeleton } from "@/components/ui/skeleton";

type LoadingVariant = "table" | "detail" | "form";

interface PageDataLoadingProps {
  variant?: LoadingVariant;
}

const TABLE_ROW_KEYS = [
  "table-row-1",
  "table-row-2",
  "table-row-3",
  "table-row-4",
  "table-row-5",
  "table-row-6",
  "table-row-7",
  "table-row-8",
] as const;

const DETAIL_ROW_KEYS = [
  "detail-row-1",
  "detail-row-2",
  "detail-row-3",
  "detail-row-4",
  "detail-row-5",
  "detail-row-6",
  "detail-row-7",
  "detail-row-8",
  "detail-row-9",
  "detail-row-10",
] as const;

const FORM_FIELD_KEYS = [
  "form-field-1",
  "form-field-2",
  "form-field-3",
  "form-field-4",
  "form-field-5",
  "form-field-6",
  "form-field-7",
  "form-field-8",
] as const;

function TableLoading() {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-6 gap-3">
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
      </div>
      {TABLE_ROW_KEYS.map((key) => (
        <div key={key} className="grid grid-cols-6 gap-3 py-1">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      ))}
    </div>
  );
}

function DetailLoading() {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      {DETAIL_ROW_KEYS.map((key) => (
        <div key={key} className="grid grid-cols-3 gap-3 py-1">
          <Skeleton className="h-6" />
          <Skeleton className="col-span-2 h-6" />
        </div>
      ))}
    </div>
  );
}

function FormLoading() {
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FORM_FIELD_KEYS.map((key) => (
          <div key={key} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

export default function PageDataLoading({
  variant = "table",
}: Readonly<PageDataLoadingProps>) {
  if (variant === "detail") {
    return <DetailLoading />;
  }

  if (variant === "form") {
    return <FormLoading />;
  }

  return <TableLoading />;
}

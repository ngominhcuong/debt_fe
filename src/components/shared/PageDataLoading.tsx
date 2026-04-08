import { Skeleton } from "@/components/ui/skeleton";

type LoadingVariant = "table" | "detail" | "form";

interface PageDataLoadingProps {
  variant?: LoadingVariant;
}

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
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="grid grid-cols-6 gap-3 py-1">
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
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="grid grid-cols-3 gap-3 py-1">
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
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-2">
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

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyVnd(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const parsed = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(parsed)) {
    return "-";
  }

  return `${parsed.toLocaleString("en-US")} VNĐ`;
}

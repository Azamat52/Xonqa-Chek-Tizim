import { STATUS_LABELS } from "@/admin/lib/format";
import { cn } from "@/lib/utils";

const STYLES = {
  printed: "bg-success/15 text-success",
  saved: "bg-info/15 text-info",
  cancelled: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

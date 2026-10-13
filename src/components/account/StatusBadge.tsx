import { statusLabel, type Status } from "@/server/appointments";

const tone: Record<Status, string> = {
  pending: "border-gold text-ink",
  confirmed: "border-forest bg-forest text-paper",
  cancelled: "border-stone-deep text-muted",
  rejected: "border-stone-deep text-muted",
  completed: "border-stone-deep text-muted",
  no_show: "border-stone-deep text-muted",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-block rounded-[2px] border px-2.5 py-1 text-xs font-medium tracking-[0.04em] ${tone[status]}`}>
      {statusLabel[status]}
    </span>
  );
}

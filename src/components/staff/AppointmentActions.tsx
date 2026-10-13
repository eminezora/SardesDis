"use client";

import { useActionState, useState } from "react";
import { setAppointmentStatus, type StaffActionState } from "@/actions/staff";
import { SubmitButton } from "@/components/forms";

type Status = "pending" | "confirmed" | "cancelled" | "rejected" | "completed" | "no_show";

const actionLabel: Record<string, string> = {
  confirmed: "Onayla",
  rejected: "Uygun değil",
  completed: "Tamamlandı",
  no_show: "Gelmedi",
  cancelled: "İptal et",
};

export function AppointmentActions({
  id,
  transitions,
  doctorSlug,
  doctors,
  status,
}: {
  id: number;
  transitions: Status[];
  doctorSlug: string | null;
  doctors: { slug: string; label: string }[];
  status: Status;
}) {
  const [state, action] = useActionState<StaffActionState, FormData>(setAppointmentStatus, {});
  const [doctor, setDoctor] = useState(doctorSlug ?? "");
  if (transitions.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {status === "pending" && (
        <label className="text-sm text-muted">
          Hekim
          <select
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
            className="ml-2 min-h-10 rounded-[2px] border border-stone-deep bg-paper px-2 text-ink"
          >
            <option value="">Belirlenmedi</option>
            {doctors.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {transitions.map((t) => (
          <form key={t} action={action}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value={t} />
            {t === "confirmed" && <input type="hidden" name="doctor" value={doctor} />}
            <SubmitButton
              variant={t === "confirmed" || t === "completed" ? "primary" : t === "cancelled" || t === "rejected" ? "danger" : "outline"}
              pendingText="…"
              className="!min-h-10 !px-4 text-sm"
            >
              {actionLabel[t]}
            </SubmitButton>
          </form>
        ))}
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-[#9b3b2f]">
          {state.error}
        </p>
      )}
    </div>
  );
}

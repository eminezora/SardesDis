"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { bookingOpen } from "@/lib/booking-status";
import { isValidDate } from "@/lib/time";
import { str } from "@/lib/validation";
import { getCurrentUser } from "@/server/auth";
import { BookingError, cancelByPatient, createAppointment } from "@/server/appointments";
import type { FormState } from "./auth";

export async function bookAppointment(_: FormState, form: FormData): Promise<FormState> {
  if (!bookingOpen) return { error: "Online randevu şu anda kapalı." };
  const user = await getCurrentUser();
  if (!user) redirect("/giris?sonra=/randevu");

  const date = str(form, "date");
  const time = str(form, "time");
  const doctor = str(form, "doctor");
  if (!isValidDate(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return { error: "Lütfen bir gün ve saat seçin." };
  }

  try {
    createAppointment({
      patientId: user.id,
      date,
      time,
      doctorSlug: doctor && doctor !== "any" ? doctor : null,
    });
  } catch (e) {
    if (e instanceof BookingError) return { error: e.message };
    throw e;
  }
  revalidatePath("/hesabim");
  redirect("/hesabim?talep=alindi");
}

export async function cancelAppointment(form: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const id = Number(form.get("id"));
  let failed = false;
  try {
    cancelByPatient(user.id, id);
  } catch (e) {
    if (!(e instanceof BookingError)) throw e;
    failed = true;
  }
  revalidatePath("/hesabim");
  // Adres çubuğuna serbest metin konmaz; sayfa yalnızca bilinen kodları tanır
  redirect(failed ? "/hesabim?iptal=olmadi" : "/hesabim?iptal=tamam");
}

"use server";

import { revalidatePath } from "next/cache";
import { isValidDate, istanbulDate } from "@/lib/time";
import { str } from "@/lib/validation";
import { requireUser } from "@/server/auth";
import { addRecord, audit, getRecord, isPatient, softDeleteRecord } from "@/server/records";

export type RecordState = { error?: string; ok?: string };

/** Hasta dosyasına muayene / tedavi notu ekler */
export async function addNote(_: RecordState, form: FormData): Promise<RecordState> {
  const user = await requireUser("staff");
  const patientId = Number(form.get("patientId"));
  if (!Number.isInteger(patientId) || !isPatient(patientId)) return { error: "Hasta bulunamadı." };

  const title = str(form, "title").slice(0, 120);
  const body = str(form, "body").slice(0, 8000);
  const dateRaw = str(form, "recordDate");
  if (!title) return { error: "Lütfen bir başlık yazın." };
  if (!body) return { error: "Not boş olamaz." };

  const id = addRecord({
    patientId,
    kind: "note",
    title,
    body,
    recordDate: isValidDate(dateRaw) ? dateRaw : istanbulDate(),
    createdBy: user.id,
  });
  audit(user.id, "record.create", { patientId, recordId: id });
  revalidatePath(`/yonetim/hasta/${patientId}`);
  return { ok: "Not eklendi." };
}

/** Kaydı "silindi" olarak işaretler (yalnızca doktor). Dosya diskte kalır. */
export async function deleteRecord(_: RecordState, form: FormData): Promise<RecordState> {
  const user = await requireUser("staff");
  if (user.staffRole !== "doctor") return { error: "Kayıt silme yetkisi yalnızca doktorlardadır." };
  const record = getRecord(Number(form.get("id")));
  if (!record) return { error: "Kayıt bulunamadı." };
  softDeleteRecord(record.id, user.id);
  audit(user.id, "record.delete", { patientId: record.patient_id, recordId: record.id });
  revalidatePath(`/yonetim/hasta/${record.patient_id}`);
  return { ok: "Kayıt silindi." };
}

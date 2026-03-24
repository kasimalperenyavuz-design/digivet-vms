"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const appointmentSchema = z.object({
  petId: z.string().min(1, "Hasta seçimi zorunludur"),
  vetId: z.string().min(1, "Veteriner seçimi zorunludur"),
  type: z.enum(["CHECKUP", "VACCINATION", "SURGERY", "GROOMING", "HOTEL", "LAB", "EMERGENCY", "FOLLOWUP"]),
  date: z.string().min(1, "Tarih zorunludur"),
  time: z.string().min(1, "Saat zorunludur"),
  duration: z.coerce.number().min(5).max(480).default(30),
  reason: z.string().optional(),
  notes: z.string().optional(),
  source: z.enum(["MANUAL", "ONLINE", "PHONE"]).default("MANUAL"),
});

export type AppointmentFormState = {
  success?: boolean;
  appointmentId?: string;
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createAppointment(
  prevState: AppointmentFormState,
  formData: FormData
): Promise<AppointmentFormState> {
  const session = await auth();
  if (!session) return { message: "Oturum bulunamadı" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = appointmentSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const d = parsed.data;

  try {
    const startTime = new Date(`${d.date}T${d.time}`);
    const endTime = new Date(startTime.getTime() + d.duration * 60 * 1000);

    // Çakışma kontrolü
    const conflict = await db.appointment.findFirst({
      where: {
        tenantId: session.user.tenantId,
        vetId: d.vetId,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } },
        ],
      },
    });

    if (conflict) {
      return { message: "Bu zaman diliminde veteriner hekimin başka bir randevusu var. Lütfen farklı saat seçin." };
    }

    const appointment = await db.appointment.create({
      data: {
        tenantId: session.user.tenantId,
        petId: d.petId,
        vetId: d.vetId,
        type: d.type,
        status: "SCHEDULED",
        startTime,
        endTime,
        duration: d.duration,
        reason: d.reason || null,
        notes: d.notes || null,
        source: d.source,
      },
    });

    revalidatePath("/dashboard/appointments");
    return { success: true, appointmentId: appointment.id };
  } catch (error) {
    console.error("[createAppointment]", error);
    return { message: "Randevu oluşturulurken bir hata oluştu." };
  }
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session) return { success: false, error: "Oturum bulunamadı" };

  try {
    await db.appointment.updateMany({
      where: { id: appointmentId, tenantId: session.user.tenantId },
      data: { status: status as never },
    });

    revalidatePath("/dashboard/appointments");
    revalidatePath(`/dashboard/appointments/${appointmentId}`);
    return { success: true };
  } catch (error) {
    console.error("[updateAppointmentStatus]", error);
    return { success: false, error: "Durum güncellenemedi" };
  }
}

export async function cancelAppointment(
  appointmentId: string
): Promise<{ success: boolean; error?: string }> {
  return updateAppointmentStatus(appointmentId, "CANCELLED");
}

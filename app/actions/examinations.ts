"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const examinationSchema = z.object({
  petId: z.string().min(1, "Hasta seçimi zorunludur"),
  vetId: z.string().min(1, "Veteriner seçimi zorunludur"),
  appointmentId: z.string().optional(),
  weight: z.coerce.number().positive().optional().or(z.literal("")),
  temperature: z.coerce.number().positive().optional().or(z.literal("")),
  heartRate: z.coerce.number().int().positive().optional().or(z.literal("")),
  respRate: z.coerce.number().int().positive().optional().or(z.literal("")),
  spO2: z.coerce.number().positive().optional().or(z.literal("")),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  diagnosisCodes: z.string().optional(), // comma-separated
});

export type ExaminationFormState = {
  success?: boolean;
  examinationId?: string;
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createExamination(
  prevState: ExaminationFormState,
  formData: FormData
): Promise<ExaminationFormState> {
  const session = await auth();
  if (!session) return { message: "Oturum bulunamadı" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = examinationSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const d = parsed.data;

  try {
    // Aynı randevuya bağlı muayene kontrolü
    if (d.appointmentId) {
      const existing = await db.examination.findUnique({
        where: { appointmentId: d.appointmentId },
      });
      if (existing) {
        return { message: "Bu randevuya zaten bir muayene kaydı eklenmiş." };
      }
    }

    const codes = d.diagnosisCodes
      ? d.diagnosisCodes.split(",").map((c) => c.trim()).filter(Boolean)
      : [];

    const examination = await db.examination.create({
      data: {
        tenantId: session.user.tenantId,
        petId: d.petId,
        vetId: d.vetId,
        appointmentId: d.appointmentId || null,
        weight: d.weight ? Number(d.weight) : null,
        temperature: d.temperature ? Number(d.temperature) : null,
        heartRate: d.heartRate ? Number(d.heartRate) : null,
        respRate: d.respRate ? Number(d.respRate) : null,
        spO2: d.spO2 ? Number(d.spO2) : null,
        subjective: d.subjective || null,
        objective: d.objective || null,
        assessment: d.assessment || null,
        plan: d.plan || null,
        diagnosisCodes: codes,
        status: "DRAFT",
      },
    });

    // Eğer randevuya bağlıysa, randevu durumunu güncelle
    if (d.appointmentId) {
      await db.appointment.updateMany({
        where: { id: d.appointmentId, tenantId: session.user.tenantId },
        data: { status: "IN_PROGRESS" },
      });
    }

    revalidatePath("/dashboard/examinations");
    revalidatePath("/dashboard/appointments");
    return { success: true, examinationId: examination.id };
  } catch (error) {
    console.error("[createExamination]", error);
    return { message: "Muayene oluşturulurken bir hata oluştu." };
  }
}

export async function updateExamination(
  examinationId: string,
  formData: FormData
): Promise<ExaminationFormState> {
  const session = await auth();
  if (!session) return { message: "Oturum bulunamadı" };

  try {
    // İmzalanmış muayene düzenlenemez
    const exam = await db.examination.findFirst({
      where: { id: examinationId, tenantId: session.user.tenantId },
    });
    if (!exam) return { message: "Muayene bulunamadı." };
    if (exam.status === "SIGNED") return { message: "İmzalanmış muayene düzenlenemez." };

    const raw = Object.fromEntries(formData.entries());
    const codes = raw.diagnosisCodes
      ? String(raw.diagnosisCodes).split(",").map((c) => c.trim()).filter(Boolean)
      : [];

    await db.examination.update({
      where: { id: examinationId },
      data: {
        weight: raw.weight ? Number(raw.weight) : null,
        temperature: raw.temperature ? Number(raw.temperature) : null,
        heartRate: raw.heartRate ? Number(raw.heartRate) : null,
        respRate: raw.respRate ? Number(raw.respRate) : null,
        spO2: raw.spO2 ? Number(raw.spO2) : null,
        subjective: (raw.subjective as string) || null,
        objective: (raw.objective as string) || null,
        assessment: (raw.assessment as string) || null,
        plan: (raw.plan as string) || null,
        diagnosisCodes: codes,
      },
    });

    revalidatePath(`/dashboard/examinations/${examinationId}`);
    revalidatePath("/dashboard/examinations");
    return { success: true, examinationId };
  } catch (error) {
    console.error("[updateExamination]", error);
    return { message: "Muayene güncellenirken bir hata oluştu." };
  }
}

export async function signExamination(
  examinationId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session) return { success: false, error: "Oturum bulunamadı" };

  try {
    const exam = await db.examination.findFirst({
      where: { id: examinationId, tenantId: session.user.tenantId },
    });
    if (!exam) return { success: false, error: "Muayene bulunamadı." };
    if (exam.status === "SIGNED") return { success: false, error: "Muayene zaten imzalanmış." };

    // SOAP alanlarının doluluğunu kontrol et
    if (!exam.subjective && !exam.objective && !exam.assessment && !exam.plan) {
      return { success: false, error: "İmzalamak için en az bir SOAP alanının doldurulması gerekir." };
    }

    await db.examination.update({
      where: { id: examinationId },
      data: {
        status: "SIGNED",
        signedAt: new Date(),
      },
    });

    // Bağlı randevuyu tamamlandı olarak işaretle
    if (exam.appointmentId) {
      await db.appointment.updateMany({
        where: { id: exam.appointmentId, tenantId: session.user.tenantId },
        data: { status: "COMPLETED" },
      });
    }

    revalidatePath(`/dashboard/examinations/${examinationId}`);
    revalidatePath("/dashboard/examinations");
    revalidatePath("/dashboard/appointments");
    return { success: true };
  } catch (error) {
    console.error("[signExamination]", error);
    return { success: false, error: "İmzalama işlemi sırasında hata oluştu." };
  }
}

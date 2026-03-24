"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addExamFile(
  examinationId: string,
  data: { url: string; name: string; type: string; size: number }
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const exam = await db.examination.findFirst({
    where: { id: examinationId, tenantId: session.user.tenantId },
  });

  if (!exam) throw new Error("Examination not found");

  const file = await db.examFile.create({
    data: {
      examinationId: exam.id,
      url: data.url,
      name: data.name,
      type: data.type,
      size: data.size,
    },
  });

  revalidatePath(`/dashboard/examinations/${exam.id}`);
  return file;
}

export async function removeExamFile(fileId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const file = await db.examFile.findUnique({
    where: { id: fileId },
    include: { examination: true },
  });

  if (!file || file.examination.tenantId !== session.user.tenantId) {
    throw new Error("File not found");
  }

  // S3 or Vercel Blob deletion can be implemented here in production.
  await db.examFile.delete({ where: { id: fileId } });

  revalidatePath(`/dashboard/examinations/${file.examinationId}`);
}

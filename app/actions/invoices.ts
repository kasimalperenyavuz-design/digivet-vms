"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function createInvoiceFromExamination(examinationId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const exam = await db.examination.findFirst({
    where: { id: examinationId, tenantId: session.user.tenantId },
    include: {
      prescription: { include: { items: true } },
      pet: { select: { ownerId: true } }
    }
  });

  if (!exam) throw new Error("Muayene bulunamadı");
  if (exam.status !== "SIGNED") throw new Error("Taslak muayeneden fatura oluşturulamaz");

  const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;

  const items = [];
  
  items.push({
    type: "SERVICE" as const,
    description: "Genel Muayene Ücreti",
    quantity: 1,
    unitPrice: 500, 
    taxRate: 20,
    total: 500,
  });

  exam.prescription.forEach(rx => {
    rx.items.forEach(item => {
      items.push({
        type: "DRUG" as const,
        description: `İlaç: ${item.drugName}`,
        quantity: item.quantity || 1,
        unitPrice: 100, // Placeholder
        taxRate: 20,
        total: 100 * (item.quantity || 1),
      });
    });
  });

  const subtotal = items.reduce((acc, current) => acc + current.total, 0);
  const tax = items.reduce((acc, current) => acc + (current.total * current.taxRate / 100), 0);
  const total = subtotal + tax;

  const invoice = await db.invoice.create({
    data: {
      tenantId: session.user.tenantId,
      petId: exam.petId,
      ownerId: exam.pet.ownerId,
      invoiceNo,
      status: "DRAFT",
      subtotal,
      tax,
      total,
      items: {
        create: items
      }
    }
  });

  redirect(`/dashboard/invoices`);
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const examination = await db.examination.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        pet: {
          select: {
            id: true, name: true, species: true, breed: true,
            gender: true, birthDate: true, color: true, microchip: true,
            owner: { select: { id: true, firstName: true, lastName: true, phone: true } },
          },
        },
        vet: {
          select: { id: true, firstName: true, lastName: true, title: true, diplomaNo: true },
        },
        appointment: {
          select: { id: true, type: true, status: true, startTime: true, reason: true },
        },
        prescription: {
          select: { id: true, status: true, issueDate: true, _count: { select: { items: true } } },
        },
        files: true,
      },
    });

    if (!examination) {
      return NextResponse.json({ error: "Muayene bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(examination);
  } catch (error) {
    console.error("[GET /api/examinations/[id]]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const exam = await db.examination.findFirst({
      where: { id, tenantId: session.user.tenantId },
    });
    if (!exam) return NextResponse.json({ error: "Muayene bulunamadı" }, { status: 404 });
    if (exam.status === "SIGNED") {
      return NextResponse.json({ error: "İmzalanmış muayene düzenlenemez" }, { status: 403 });
    }

    const body = await req.json();

    const updated = await db.examination.update({
      where: { id },
      data: {
        weight: body.weight ?? null,
        temperature: body.temperature ?? null,
        heartRate: body.heartRate ?? null,
        respRate: body.respRate ?? null,
        spO2: body.spO2 ?? null,
        subjective: body.subjective ?? null,
        objective: body.objective ?? null,
        assessment: body.assessment ?? null,
        plan: body.plan ?? null,
        diagnosisCodes: body.diagnosisCodes ?? [],
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PUT /api/examinations/[id]]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const exam = await db.examination.findFirst({
      where: { id, tenantId: session.user.tenantId },
    });
    if (!exam) return NextResponse.json({ error: "Muayene bulunamadı" }, { status: 404 });

    if (body.status === "SIGNED") {
      if (exam.status === "SIGNED") {
        return NextResponse.json({ error: "Muayene zaten imzalanmış" }, { status: 400 });
      }

      if (!exam.subjective && !exam.objective && !exam.assessment && !exam.plan) {
        return NextResponse.json(
          { error: "İmzalamak için en az bir SOAP alanının doldurulması gerekir" },
          { status: 400 }
        );
      }

      const updated = await db.examination.update({
        where: { id },
        data: { status: "SIGNED", signedAt: new Date() },
      });

      // Bağlı randevuyu tamamla
      if (exam.appointmentId) {
        await db.appointment.updateMany({
          where: { id: exam.appointmentId, tenantId: session.user.tenantId },
          data: { status: "COMPLETED" },
        });
      }

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
  } catch (error) {
    console.error("[PATCH /api/examinations/[id]]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

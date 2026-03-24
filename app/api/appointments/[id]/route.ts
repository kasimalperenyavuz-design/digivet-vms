import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const appointment = await db.appointment.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        pet: {
          include: {
            owner: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
          },
        },
        vet: { select: { id: true, firstName: true, lastName: true, title: true } },
        examination: true,
      },
    });

    if (!appointment) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    return NextResponse.json(appointment);
  } catch (error) {
    console.error("[GET /api/appointments/:id]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();

    const existing = await db.appointment.findFirst({
      where: { id, tenantId: session.user.tenantId },
    });
    if (!existing) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

    const startTime = body.startTime ? new Date(body.startTime) : undefined;
    const duration = body.duration || existing.duration;
    const endTime = startTime
      ? new Date(startTime.getTime() + duration * 60 * 1000)
      : undefined;

    const appointment = await db.appointment.update({
      where: { id },
      data: {
        ...(body.type ? { type: body.type } : {}),
        ...(startTime ? { startTime, endTime } : {}),
        ...(body.duration ? { duration: body.duration } : {}),
        ...(body.reason !== undefined ? { reason: body.reason } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.vetId ? { vetId: body.vetId } : {}),
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("[PUT /api/appointments/:id]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();

    if (!body.status) {
      return NextResponse.json({ error: "Status gerekli" }, { status: 400 });
    }

    const validStatuses = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Geçersiz status" }, { status: 400 });
    }

    const appointment = await db.appointment.updateMany({
      where: { id, tenantId: session.user.tenantId },
      data: { status: body.status },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("[PATCH /api/appointments/:id]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

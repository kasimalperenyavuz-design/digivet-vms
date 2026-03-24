import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const appointmentSchema = z.object({
  petId: z.string().min(1),
  vetId: z.string().min(1),
  type: z.enum(["CHECKUP", "VACCINATION", "SURGERY", "GROOMING", "HOTEL", "LAB", "EMERGENCY", "FOLLOWUP"]).default("CHECKUP"),
  startTime: z.string(),
  duration: z.number().min(5).max(480).default(30),
  reason: z.string().optional(),
  notes: z.string().optional(),
  source: z.enum(["MANUAL", "ONLINE", "PHONE"]).default("MANUAL"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const vetId = searchParams.get("vetId");
    const status = searchParams.get("status");
    const petId = searchParams.get("petId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 50;

    // Date range filter
    let dateFilter = {};
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      dateFilter = { startTime: { gte: startOfDay, lte: endOfDay } };
    }

    // Week range filter (for calendar view)
    const weekStart = searchParams.get("weekStart");
    const weekEnd = searchParams.get("weekEnd");
    if (weekStart && weekEnd) {
      dateFilter = {
        startTime: {
          gte: new Date(weekStart),
          lte: new Date(weekEnd),
        },
      };
    }

    const where = {
      tenantId: session.user.tenantId,
      ...dateFilter,
      ...(vetId ? { vetId } : {}),
      ...(status ? { status: status as never } : {}),
      ...(petId ? { petId } : {}),
    };

    const [appointments, total] = await Promise.all([
      db.appointment.findMany({
        where,
        include: {
          pet: {
            select: { id: true, name: true, species: true, breed: true },
          },
          vet: {
            select: { id: true, firstName: true, lastName: true, title: true },
          },
        },
        orderBy: { startTime: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.appointment.count({ where }),
    ]);

    return NextResponse.json({ appointments, total, page, pageSize });
  } catch (error) {
    console.error("[GET /api/appointments]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = appointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + data.duration * 60 * 1000);

    // Çakışma kontrolü
    const conflict = await db.appointment.findFirst({
      where: {
        tenantId: session.user.tenantId,
        vetId: data.vetId,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } },
        ],
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Bu zaman diliminde veteriner hekimin başka bir randevusu bulunuyor." },
        { status: 409 }
      );
    }

    const appointment = await db.appointment.create({
      data: {
        tenantId: session.user.tenantId,
        petId: data.petId,
        vetId: data.vetId,
        type: data.type,
        status: "SCHEDULED",
        startTime,
        endTime,
        duration: data.duration,
        reason: data.reason || null,
        notes: data.notes || null,
        source: data.source,
      },
      include: {
        pet: { select: { id: true, name: true, species: true } },
        vet: { select: { id: true, firstName: true, lastName: true, title: true } },
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("[POST /api/appointments]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const examinationSchema = z.object({
  petId: z.string().min(1),
  vetId: z.string().min(1),
  appointmentId: z.string().optional(),
  weight: z.number().positive().optional(),
  temperature: z.number().positive().optional(),
  heartRate: z.number().int().positive().optional(),
  respRate: z.number().int().positive().optional(),
  spO2: z.number().positive().optional(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  diagnosisCodes: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const vetId = searchParams.get("vetId");
    const petId = searchParams.get("petId");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 50;

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
    };

    if (vetId) where.vetId = vetId;
    if (petId) where.petId = petId;
    if (status) where.status = status;

    if (dateFrom || dateTo) {
      where.examDate = {};
      if (dateFrom) (where.examDate as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        (where.examDate as Record<string, unknown>).lte = end;
      }
    }

    // Hasta adı ile arama
    if (search) {
      where.pet = {
        name: { contains: search, mode: "insensitive" },
      };
    }

    const [examinations, total] = await Promise.all([
      db.examination.findMany({
        where,
        include: {
          pet: {
            select: { id: true, name: true, species: true, breed: true },
          },
          vet: {
            select: { id: true, firstName: true, lastName: true, title: true },
          },
          appointment: {
            select: { id: true, type: true, status: true },
          },
          _count: {
            select: { prescription: true, files: true },
          },
        },
        orderBy: { examDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.examination.count({ where }),
    ]);

    return NextResponse.json({ examinations, total, page, pageSize });
  } catch (error) {
    console.error("[GET /api/examinations]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = examinationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    // Aynı randevuya bağlı muayene kontrolü
    if (data.appointmentId) {
      const existing = await db.examination.findUnique({
        where: { appointmentId: data.appointmentId },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Bu randevuya zaten bir muayene kaydı eklenmiş." },
          { status: 409 }
        );
      }
    }

    const examination = await db.examination.create({
      data: {
        tenantId: session.user.tenantId,
        petId: data.petId,
        vetId: data.vetId,
        appointmentId: data.appointmentId || null,
        weight: data.weight || null,
        temperature: data.temperature || null,
        heartRate: data.heartRate || null,
        respRate: data.respRate || null,
        spO2: data.spO2 || null,
        subjective: data.subjective || null,
        objective: data.objective || null,
        assessment: data.assessment || null,
        plan: data.plan || null,
        diagnosisCodes: data.diagnosisCodes,
        status: "DRAFT",
      },
      include: {
        pet: { select: { id: true, name: true, species: true } },
        vet: { select: { id: true, firstName: true, lastName: true, title: true } },
      },
    });

    return NextResponse.json(examination, { status: 201 });
  } catch (error) {
    console.error("[POST /api/examinations]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

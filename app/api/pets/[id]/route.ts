import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const pet = await db.pet.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        owner: true,
        appointments: {
          orderBy: { startTime: "desc" },
          include: { vet: { select: { firstName: true, lastName: true, title: true } } },
        },
        examinations: {
          orderBy: { examDate: "desc" },
          include: {
            vet: { select: { firstName: true, lastName: true } },
            prescription: { include: { items: true } },
          },
        },
        vaccines: { orderBy: { vaccinationDate: "desc" } },
        invoices: { orderBy: { issueDate: "desc" }, take: 10 },
      },
    });

    if (!pet) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    return NextResponse.json(pet);
  } catch (error) {
    console.error("[GET /api/pets/:id]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();

    const pet = await db.pet.updateMany({
      where: { id, tenantId: session.user.tenantId },
      data: {
        name: body.name,
        breed: body.breed,
        gender: body.gender,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
        color: body.color,
        microchip: body.microchip,
        passportNo: body.passportNo,
        isNeutered: body.isNeutered,
        notes: body.notes,
      },
    });

    return NextResponse.json(pet);
  } catch (error) {
    console.error("[PUT /api/pets/:id]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

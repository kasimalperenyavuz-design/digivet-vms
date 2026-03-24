import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const petSchema = z.object({
  ownerId: z.string(),
  name: z.string().min(1),
  species: z.enum(["DOG", "CAT", "BIRD", "RABBIT", "REPTILE", "RODENT", "OTHER"]),
  breed: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]).default("UNKNOWN"),
  birthDate: z.string().optional(),
  color: z.string().optional(),
  microchip: z.string().optional(),
  passportNo: z.string().optional(),
  isNeutered: z.boolean().default(false),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const ownerId = searchParams.get("ownerId");
    const species = searchParams.get("species");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 20;

    const where = {
      tenantId: session.user.tenantId,
      isDeceased: false,
      ...(ownerId ? { ownerId } : {}),
      ...(species ? { species: species as never } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { microchip: { contains: q } },
              { breed: { contains: q, mode: "insensitive" as const } },
              { owner: { firstName: { contains: q, mode: "insensitive" as const } } },
              { owner: { lastName: { contains: q, mode: "insensitive" as const } } },
              { owner: { phone: { contains: q } } },
            ],
          }
        : {}),
    };

    const [pets, total] = await Promise.all([
      db.pet.findMany({
        where,
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, phone: true } },
          _count: { select: { appointments: true, examinations: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.pet.count({ where }),
    ]);

    return NextResponse.json({ pets, total, page, pageSize });
  } catch (error) {
    console.error("[GET /api/pets]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = petSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const pet = await db.pet.create({
      data: {
        tenantId: session.user.tenantId,
        ownerId: data.ownerId,
        name: data.name,
        species: data.species,
        breed: data.breed || null,
        gender: data.gender,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        color: data.color || null,
        microchip: data.microchip || null,
        passportNo: data.passportNo || null,
        isNeutered: data.isNeutered,
        notes: data.notes || null,
      },
      include: { owner: true },
    });

    return NextResponse.json(pet, { status: 201 });
  } catch (error) {
    console.error("[POST /api/pets]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

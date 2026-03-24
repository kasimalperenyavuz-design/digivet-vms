import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const ownerSchema = z.object({
  firstName: z.string().min(1, "Ad zorunludur"),
  lastName: z.string().min(1, "Soyad zorunludur"),
  phone: z.string().min(10, "Geçerli bir telefon numarası girin"),
  email: z.string().email("Geçerli e-posta girin").optional().or(z.literal("")),
  tcNo: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      district: z.string().optional(),
      city: z.string().optional(),
    })
    .optional(),
  notes: z.string().optional(),
  kvkkConsent: z.boolean(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 20;

    const where = {
      tenantId: session.user.tenantId,
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" as const } },
              { lastName: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q } },
              { email: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [owners, total] = await Promise.all([
      db.petOwner.findMany({
        where,
        include: {
          pets: { where: { isDeceased: false }, select: { id: true, name: true, species: true } },
          _count: { select: { pets: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.petOwner.count({ where }),
    ]);

    return NextResponse.json({ owners, total, page, pageSize });
  } catch (error) {
    console.error("[GET /api/owners]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = ownerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const owner = await db.petOwner.create({
      data: {
        tenantId: session.user.tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email || null,
        tcNo: data.tcNo || null,
        address: data.address || {},
        notes: data.notes || null,
        kvkkConsent: data.kvkkConsent,
        kvkkDate: data.kvkkConsent ? new Date() : null,
      },
    });

    return NextResponse.json(owner, { status: 201 });
  } catch (error) {
    console.error("[POST /api/owners]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const owner = await db.petOwner.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        pets: {
          include: {
            appointments: { orderBy: { startTime: "desc" }, take: 3 },
            vaccines: { orderBy: { vaccinationDate: "desc" }, take: 3 },
          },
        },
        invoices: { orderBy: { issueDate: "desc" }, take: 5 },
      },
    });

    if (!owner) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    return NextResponse.json(owner);
  } catch (error) {
    console.error("[GET /api/owners/:id]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();

    const owner = await db.petOwner.updateMany({
      where: { id, tenantId: session.user.tenantId },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        email: body.email || null,
        address: body.address,
        notes: body.notes,
      },
    });

    return NextResponse.json(owner);
  } catch (error) {
    console.error("[PUT /api/owners/:id]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    // Soft delete - hayvanlara dokunma
    await db.petOwner.updateMany({
      where: { id, tenantId: session.user.tenantId },
      data: { notes: "[SİLİNDİ]" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/owners/:id]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

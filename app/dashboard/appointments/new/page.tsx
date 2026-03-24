import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import NewAppointmentForm from "./NewAppointmentForm";

async function getFormData(tenantId: string) {
  const [pets, vets] = await Promise.all([
    db.pet.findMany({
      where: { tenantId, isDeceased: false },
      include: {
        owner: { select: { firstName: true, lastName: true, phone: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { tenantId, isActive: true, role: { in: ["VET", "ADMIN", "OWNER"] } },
      select: { id: true, firstName: true, lastName: true, title: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  return { pets, vets };
}

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ petId?: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const { petId } = await searchParams;
  const { pets, vets } = await getFormData(session.user.tenantId);

  const petsData = pets.map((p) => ({
    id: p.id,
    name: p.name,
    species: p.species,
    breed: p.breed,
    ownerName: `${p.owner.firstName} ${p.owner.lastName}`,
    ownerPhone: p.owner.phone,
  }));

  const vetsData = vets.map((v) => ({
    id: v.id,
    name: `${v.title || "Dr."} ${v.firstName} ${v.lastName}`,
  }));

  return <NewAppointmentForm pets={petsData} vets={vetsData} preselectedPetId={petId} />;
}

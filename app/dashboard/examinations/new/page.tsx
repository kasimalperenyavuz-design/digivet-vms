import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import NewExaminationForm from "./NewExaminationForm";

export default async function NewExaminationPage({
  searchParams,
}: {
  searchParams: Promise<{ appointmentId?: string; petId?: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const { appointmentId, petId } = await searchParams;

  // Hastalar ve veterinerler
  const [pets, vets, appointment] = await Promise.all([
    db.pet.findMany({
      where: { tenantId: session.user.tenantId },
      select: {
        id: true,
        name: true,
        species: true,
        breed: true,
        owner: { select: { firstName: true, lastName: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { tenantId: session.user.tenantId, isActive: true, role: { in: ["VET", "ADMIN", "OWNER"] } },
      select: { id: true, firstName: true, lastName: true, title: true },
      orderBy: { firstName: "asc" },
    }),
    appointmentId
      ? db.appointment.findFirst({
          where: { id: appointmentId, tenantId: session.user.tenantId },
          select: {
            id: true,
            type: true,
            reason: true,
            startTime: true,
            pet: { select: { id: true, name: true, species: true } },
            vet: { select: { id: true, firstName: true, lastName: true, title: true } },
          },
        })
      : null,
  ]);

  return (
    <NewExaminationForm
      pets={pets}
      vets={vets}
      appointment={appointment}
      preselectedPetId={petId || appointment?.pet?.id}
      preselectedVetId={appointment?.vet?.id}
      currentVetId={session.user.id}
    />
  );
}

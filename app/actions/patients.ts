"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const registerSchema = z.object({
  // Sahip bilgileri
  ownerFirstName: z.string().min(1, "Ad zorunludur"),
  ownerLastName: z.string().min(1, "Soyad zorunludur"),
  ownerPhone: z.string().min(10, "Geçerli telefon numarası girin"),
  ownerEmail: z.string().email().optional().or(z.literal("")),
  ownerTcNo: z.string().optional(),
  ownerCity: z.string().optional(),
  ownerDistrict: z.string().optional(),
  ownerNotes: z.string().optional(),
  kvkkConsent: z.coerce.boolean(),

  // Hayvan bilgileri
  petName: z.string().min(1, "Hayvan adı zorunludur"),
  petSpecies: z.enum(["DOG", "CAT", "BIRD", "RABBIT", "REPTILE", "RODENT", "OTHER"]),
  petBreed: z.string().optional(),
  petGender: z.enum(["MALE", "FEMALE", "UNKNOWN"]).default("UNKNOWN"),
  petBirthDate: z.string().optional(),
  petColor: z.string().optional(),
  petMicrochip: z.string().optional(),
  petIsNeutered: z.coerce.boolean().default(false),
  petNotes: z.string().optional(),
});

export type RegisterFormState = {
  success?: boolean;
  petId?: string;
  errors?: Record<string, string[]>;
  message?: string;
};

export async function registerPetWithOwner(
  prevState: RegisterFormState,
  formData: FormData
): Promise<RegisterFormState> {
  const session = await auth();
  if (!session) return { message: "Oturum bulunamadı" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = registerSchema.safeParse({
    ...raw,
    kvkkConsent: raw.kvkkConsent === "on" || raw.kvkkConsent === "true",
    petIsNeutered: raw.petIsNeutered === "on" || raw.petIsNeutered === "true",
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const d = parsed.data;

  try {
    // Transaction: önce sahip, sonra hayvan
    const result = await db.$transaction(async (tx: any) => {
      const owner = await tx.petOwner.create({
        data: {
          tenantId: session.user.tenantId,
          firstName: d.ownerFirstName,
          lastName: d.ownerLastName,
          phone: d.ownerPhone,
          email: d.ownerEmail || null,
          tcNo: d.ownerTcNo || null,
          address: {
            city: d.ownerCity || "",
            district: d.ownerDistrict || "",
          },
          notes: d.ownerNotes || null,
          kvkkConsent: d.kvkkConsent,
          kvkkDate: d.kvkkConsent ? new Date() : null,
        },
      });

      const pet = await tx.pet.create({
        data: {
          tenantId: session.user.tenantId,
          ownerId: owner.id,
          name: d.petName,
          species: d.petSpecies,
          breed: d.petBreed || null,
          gender: d.petGender,
          birthDate: d.petBirthDate ? new Date(d.petBirthDate) : null,
          color: d.petColor || null,
          microchip: d.petMicrochip || null,
          isNeutered: d.petIsNeutered,
          notes: d.petNotes || null,
        },
      });

      return { owner, pet };
    });

    revalidatePath("/dashboard/patients");
    return { success: true, petId: result.pet.id };
  } catch (error) {
    console.error("[registerPetWithOwner]", error);
    return { message: "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin." };
  }
}

export async function addPetToExistingOwner(
  ownerId: string,
  formData: FormData
): Promise<{ success: boolean; petId?: string; error?: string }> {
  const session = await auth();
  if (!session) return { success: false, error: "Oturum bulunamadı" };

  try {
    const pet = await db.pet.create({
      data: {
        tenantId: session.user.tenantId,
        ownerId,
        name: formData.get("petName") as string,
        species: formData.get("petSpecies") as never,
        breed: (formData.get("petBreed") as string) || null,
        gender: (formData.get("petGender") as never) || "UNKNOWN",
        birthDate: formData.get("petBirthDate")
          ? new Date(formData.get("petBirthDate") as string)
          : null,
        microchip: (formData.get("petMicrochip") as string) || null,
        isNeutered: formData.get("petIsNeutered") === "on",
      },
    });

    revalidatePath(`/dashboard/patients/${pet.id}`);
    revalidatePath("/dashboard/patients");
    return { success: true, petId: pet.id };
  } catch (error) {
    console.error("[addPetToExistingOwner]", error);
    return { success: false, error: "Kayıt hatası" };
  }
}

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seed başlıyor...");

  // Demo Klinik (Tenant)
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-klinik" },
    update: {},
    create: {
      name: "Pati Veteriner Kliniği",
      slug: "demo-klinik",
      subdomain: "demo",
      phone: "0212 555 00 00",
      email: "info@patiklinik.com",
      address: {
        street: "Bağcılar Caddesi No:42",
        district: "Bağcılar",
        city: "İstanbul",
        postalCode: "34200",
      },
      plan: "STARTER",
      settings: {
        workingHours: { start: "09:00", end: "19:00" },
        appointmentDuration: 30,
      },
    },
  });

  console.log("✅ Tenant oluşturuldu:", tenant.name);

  // Admin Kullanıcı
  const hashedPassword = await bcrypt.hash("digivet123", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@demo.com",
      password: hashedPassword,
      role: "OWNER",
      firstName: "Ahmet",
      lastName: "Yılmaz",
      title: "Dr.",
      isActive: true,
    },
  });

  console.log("✅ Admin kullanıcı:", adminUser.email);

  // Demo Veteriner
  const vetUser = await prisma.user.upsert({
    where: { email: "vet@demo.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "vet@demo.com",
      password: hashedPassword,
      role: "VET",
      firstName: "Ayşe",
      lastName: "Kara",
      title: "Dr.",
      isActive: true,
    },
  });

  console.log("✅ Veteriner:", vetUser.email);

  // Demo Hayvan Sahibi
  const owner = await prisma.petOwner.upsert({
    where: { id: "demo-owner-01" },
    update: {},
    create: {
      id: "demo-owner-01",
      tenantId: tenant.id,
      firstName: "Mehmet",
      lastName: "Demir",
      phone: "0533 123 45 67",
      email: "mehmet@example.com",
      kvkkConsent: true,
      kvkkDate: new Date(),
      address: {
        street: "Atatürk Cad. No:5",
        district: "Kadıköy",
        city: "İstanbul",
      },
    },
  });

  // Demo Hayvan
  const pet = await prisma.pet.upsert({
    where: { id: "demo-pet-01" },
    update: {},
    create: {
      id: "demo-pet-01",
      tenantId: tenant.id,
      ownerId: owner.id,
      name: "Karamel",
      species: "CAT",
      breed: "British Shorthair",
      gender: "FEMALE",
      birthDate: new Date("2021-03-15"),
      color: "Gri-Bej",
      microchip: "941000024680135",
      isNeutered: true,
    },
  });

  console.log("✅ Demo hayvan:", pet.name, "-", pet.species);

  // Demo Randevu
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      petId: pet.id,
      vetId: vetUser.id,
      type: "CHECKUP",
      status: "SCHEDULED",
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 30 * 60000),
      duration: 30,
      reason: "Yıllık kontrol muayenesi",
      source: "MANUAL",
    },
  });

  console.log("✅ Demo randevu oluşturuldu");

  console.log("\n🎉 Seed tamamlandı!");
  console.log("─────────────────────────────");
  console.log("Giriş Bilgileri:");
  console.log("  Admin:     admin@demo.com / digivet123");
  console.log("  Veteriner: vet@demo.com   / digivet123");
  console.log("─────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

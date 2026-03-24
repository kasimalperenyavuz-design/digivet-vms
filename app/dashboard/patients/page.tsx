import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  PawPrint, Plus, Search, Dog, Cat, Bird, Rabbit,
  ChevronRight, Phone, Mail, Calendar,
} from "lucide-react";

const speciesIcon: Record<string, string> = {
  DOG: "🐕",
  CAT: "🐱",
  BIRD: "🐦",
  RABBIT: "🐇",
  REPTILE: "🦎",
  RODENT: "🐭",
  OTHER: "🐾",
};

const speciesLabel: Record<string, string> = {
  DOG: "Köpek",
  CAT: "Kedi",
  BIRD: "Kuş",
  RABBIT: "Tavşan",
  REPTILE: "Sürüngen",
  RODENT: "Kemirgen",
  OTHER: "Diğer",
};

async function getPatients(tenantId: string, q: string) {
  const where = {
    tenantId,
    isDeceased: false,
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
        owner: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        _count: { select: { appointments: true, examinations: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.pet.count({ where }),
  ]);

  return { pets, total };
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const { q = "" } = await searchParams;
  const { pets, total } = await getPatients(session.user.tenantId, q);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Hastalar</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Toplam <span className="text-white font-medium">{total}</span> aktif hasta
          </p>
        </div>
        <Link
          href="/dashboard/patients/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          Yeni Hasta Kaydı
        </Link>
      </div>

      {/* Arama */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <form>
            <input
              name="q"
              defaultValue={q}
              type="text"
              placeholder="Hasta adı, çip no, sahip adı veya telefon ara..."
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
          </form>
        </div>
      </div>

      {/* Liste */}
      {pets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-800/60 rounded-2xl flex items-center justify-center mb-4">
            <PawPrint className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 text-lg font-medium">
            {q ? "Arama sonucu bulunamadı" : "Henüz hasta kaydı yok"}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {q ? "Farklı arama terimleri deneyin" : "İlk hastanızı kaydetmek için butona tıklayın"}
          </p>
          {!q && (
            <Link
              href="/dashboard/patients/new"
              className="mt-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              İlk Hastayı Kaydet
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-800/60 text-xs text-slate-500 font-medium uppercase tracking-wider">
            <div className="col-span-4">Hasta</div>
            <div className="col-span-3">Sahip</div>
            <div className="col-span-2">Tür / Irk</div>
            <div className="col-span-2 text-center">Ziyaretler</div>
            <div className="col-span-1"></div>
          </div>

          <div className="divide-y divide-slate-800/40">
            {pets.map((pet) => (
              <Link
                key={pet.id}
                href={`/dashboard/patients/${pet.id}`}
                className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-slate-800/30 transition-all group cursor-pointer items-center"
              >
                {/* Hasta */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {speciesIcon[pet.species]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {pet.name}
                    </div>
                    {pet.microchip && (
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        🔖 {pet.microchip}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sahip */}
                <div className="col-span-3">
                  <div className="text-sm text-slate-300 font-medium">
                    {pet.owner.firstName} {pet.owner.lastName}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Phone className="w-3 h-3" />
                    {pet.owner.phone}
                  </div>
                </div>

                {/* Tür */}
                <div className="col-span-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
                    {speciesLabel[pet.species]}
                  </span>
                  {pet.breed && (
                    <div className="text-xs text-slate-500 mt-1 truncate">{pet.breed}</div>
                  )}
                </div>

                {/* Ziyaretler */}
                <div className="col-span-2 flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1 text-sm text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {pet._count.appointments}
                  </div>
                  <div className="text-xs text-slate-500">randevu</div>
                </div>

                {/* Arrow */}
                <div className="col-span-1 flex justify-end">
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

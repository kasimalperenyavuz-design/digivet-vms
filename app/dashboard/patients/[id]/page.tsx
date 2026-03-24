import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  ChevronLeft, PawPrint, User, Phone, Mail, Calendar,
  Stethoscope, Syringe, FileText, ChevronRight, Tag,
  Heart, Thermometer, Activity, Clock, CheckCircle2,
  XCircle, AlertCircle, Edit,
} from "lucide-react";

const speciesIcon: Record<string, string> = {
  DOG: "🐕", CAT: "🐱", BIRD: "🐦", RABBIT: "🐇",
  REPTILE: "🦎", RODENT: "🐭", OTHER: "🐾",
};
const speciesLabel: Record<string, string> = {
  DOG: "Köpek", CAT: "Kedi", BIRD: "Kuş", RABBIT: "Tavşan",
  REPTILE: "Sürüngen", RODENT: "Kemirgen", OTHER: "Diğer",
};
const genderLabel: Record<string, string> = {
  MALE: "♂ Erkek", FEMALE: "♀ Dişi", UNKNOWN: "Bilinmiyor",
};

const apptStatusConfig: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  COMPLETED: { label: "Tamamlandı", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  SCHEDULED: { label: "Planlandı", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Clock },
  CANCELLED: { label: "İptal", cls: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle },
  IN_PROGRESS: { label: "Devam Ediyor", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Activity },
  NO_SHOW: { label: "Gelmedi", cls: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: AlertCircle },
};

const apptTypeLabel: Record<string, string> = {
  CHECKUP: "Kontrol", VACCINATION: "Aşı", SURGERY: "Ameliyat",
  GROOMING: "Tıraş", HOTEL: "Otel", LAB: "Laboratuvar",
  EMERGENCY: "Acil", FOLLOWUP: "Takip",
};

async function getPet(id: string, tenantId: string) {
  return db.pet.findFirst({
    where: { id, tenantId },
    include: {
      owner: true,
      appointments: {
        orderBy: { startTime: "desc" },
        take: 10,
        include: { vet: { select: { firstName: true, lastName: true, title: true } } },
      },
      examinations: {
        orderBy: { examDate: "desc" },
        take: 10,
        include: {
          vet: { select: { firstName: true, lastName: true } },
          prescription: { include: { items: true } },
        },
      },
      vaccines: { orderBy: { vaccinationDate: "desc" }, take: 10 },
    },
  });
}

function calcAge(birthDate: Date | null): string {
  if (!birthDate) return "Bilinmiyor";
  const now = new Date();
  const months =
    (now.getFullYear() - birthDate.getFullYear()) * 12 +
    now.getMonth() - birthDate.getMonth();
  if (months < 12) return `${months} ay`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years} yaş ${rem} ay` : `${years} yaş`;
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const { id } = await params;
  const pet = await getPet(id, session.user.tenantId);
  if (!pet) notFound();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/patients" className="hover:text-slate-300 transition-colors">
          Hastalar
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white">{pet.name}</span>
      </div>

      {/* Hero Card */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 border border-slate-700/50">
              {speciesIcon[pet.species]}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white">{pet.name}</h1>
                {pet.isNeutered && (
                  <span className="text-xs px-2.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full font-medium">
                    Kısırlaştırılmış
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                <span>{speciesLabel[pet.species]}</span>
                {pet.breed && <span>· {pet.breed}</span>}
                <span>· {genderLabel[pet.gender]}</span>
                <span>· {calcAge(pet.birthDate)}</span>
                {pet.color && <span>· {pet.color}</span>}
              </div>
              {pet.microchip && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                  <Tag className="w-3.5 h-3.5" />
                  Çip: {pet.microchip}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <Link
              href={`/dashboard/appointments/new?petId=${pet.id}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-600/20"
            >
              <Calendar className="w-4 h-4" />
              Randevu Al
            </Link>
            <Link
              href={`/dashboard/examinations/new?petId=${pet.id}`}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium rounded-xl transition-all"
            >
              <Stethoscope className="w-4 h-4" />
              Muayene
            </Link>
          </div>
        </div>

        {/* Sahip bilgisi */}
        <div className="mt-5 pt-5 border-t border-slate-800/60 flex flex-wrap gap-5">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Sahip</div>
              <Link
                href={`/dashboard/owners/${pet.owner.id}`}
                className="text-white font-medium hover:text-blue-400 transition-colors"
              >
                {pet.owner.firstName} {pet.owner.lastName}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
              <Phone className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Telefon</div>
              <a href={`tel:${pet.owner.phone}`} className="text-white font-medium hover:text-blue-400 transition-colors">
                {pet.owner.phone}
              </a>
            </div>
          </div>

          {pet.owner.email && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <div className="text-xs text-slate-500">E-posta</div>
                <span className="text-white font-medium">{pet.owner.email}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Toplam Randevu", value: pet.appointments.length, icon: Calendar, color: "blue" },
          { label: "Muayene", value: pet.examinations.length, icon: Stethoscope, color: "emerald" },
          { label: "Aşı Kaydı", value: pet.vaccines.length, icon: Syringe, color: "violet" },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              stat.color === "blue" ? "bg-blue-500/15 text-blue-400" :
              stat.color === "emerald" ? "bg-emerald-500/15 text-emerald-400" :
              "bg-violet-500/15 text-violet-400"
            }`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-400">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid: Randevular + Muayeneler + Aşılar */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Randevular */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              Randevu Geçmişi
            </h2>
          </div>
          <div className="divide-y divide-slate-800/40">
            {pet.appointments.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-500 text-sm">Randevu kaydı yok</div>
            ) : (
              pet.appointments.map((appt) => {
                const status = apptStatusConfig[appt.status] ?? apptStatusConfig.SCHEDULED;
                const StatusIcon = status.icon;
                return (
                  <div key={appt.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-800/20 transition-colors">
                    <div className="text-center w-14 flex-shrink-0">
                      <div className="text-xs font-mono text-slate-300">
                        {new Date(appt.startTime).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(appt.startTime).getFullYear()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{apptTypeLabel[appt.type] ?? appt.type}</div>
                      <div className="text-xs text-slate-500">
                        Dr. {appt.vet.firstName} {appt.vet.lastName}
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${status.cls}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Muayeneler */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-400" />
              Muayene Kayıtları
            </h2>
          </div>
          <div className="divide-y divide-slate-800/40">
            {pet.examinations.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-500 text-sm">Muayene kaydı yok</div>
            ) : (
              pet.examinations.map((exam) => (
                <Link
                  key={exam.id}
                  href={`/dashboard/examinations/${exam.id}`}
                  className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-800/20 transition-colors group"
                >
                  <div className="text-center w-14 flex-shrink-0">
                    <div className="text-xs font-mono text-slate-300">
                      {new Date(exam.examDate).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(exam.examDate).getFullYear()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                      {exam.assessment || "Muayene kaydı"}
                    </div>
                    <div className="text-xs text-slate-500">
                      Dr. {exam.vet.firstName} {exam.vet.lastName}
                      {exam.weight && ` · ${exam.weight}kg`}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                    exam.status === "SIGNED"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                  }`}>
                    {exam.status === "SIGNED" ? "İmzalı" : "Taslak"}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Aşı Takibi */}
        <div className="xl:col-span-2 bg-slate-900/60 border border-slate-800/60 rounded-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Syringe className="w-4 h-4 text-violet-400" />
              Aşı Takibi
            </h2>
            <Link
              href={`/dashboard/patients/${pet.id}/vaccines/new`}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              + Aşı Ekle
            </Link>
          </div>

          {pet.vaccines.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500 text-sm">Aşı kaydı yok</div>
          ) : (
            <div className="divide-y divide-slate-800/40">
              {pet.vaccines.map((vac) => {
                const nextDue = vac.nextDueDate ? new Date(vac.nextDueDate) : null;
                const isOverdue = nextDue && nextDue < new Date();
                // eslint-disable-next-line react-hooks/purity
                const isDueSoon = nextDue && !isOverdue && nextDue.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

                return (
                  <div key={vac.id} className="px-6 py-3.5 grid grid-cols-4 gap-4 items-center">
                    <div>
                      <div className="text-sm font-medium text-white">{vac.vaccineName}</div>
                      {vac.batchNo && <div className="text-xs text-slate-500">Lot: {vac.batchNo}</div>}
                    </div>
                    <div className="text-sm text-slate-400">
                      {new Date(vac.vaccinationDate).toLocaleDateString("tr-TR")}
                    </div>
                    <div>
                      {nextDue ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                          isOverdue
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : isDueSoon
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>
                          {isOverdue ? "⚠ Gecikmiş" : isDueSoon ? "⏰ Yaklaşıyor" : "✓ Güncel"}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400 text-right">
                      {nextDue ? `Sonraki: ${nextDue.toLocaleDateString("tr-TR")}` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

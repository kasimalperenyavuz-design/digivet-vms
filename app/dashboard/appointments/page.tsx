import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Calendar, Plus, ChevronLeft, ChevronRight,
  Clock, User, Phone, CheckCircle2, XCircle,
  Activity, AlertCircle, Search, Filter,
} from "lucide-react";
import AppointmentStatusButton from "./AppointmentStatusButton";

const speciesIcon: Record<string, string> = {
  DOG: "🐕", CAT: "🐱", BIRD: "🐦", RABBIT: "🐇",
  REPTILE: "🦎", RODENT: "🐭", OTHER: "🐾",
};

const typeLabel: Record<string, { label: string; color: string }> = {
  CHECKUP: { label: "Kontrol", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  VACCINATION: { label: "Aşı", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  SURGERY: { label: "Ameliyat", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  GROOMING: { label: "Tıraş", color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
  HOTEL: { label: "Otel", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  LAB: { label: "Laboratuvar", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  EMERGENCY: { label: "Acil", color: "bg-red-500/10 text-red-300 border-red-500/30" },
  FOLLOWUP: { label: "Takip", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

const statusConfig: Record<string, { label: string; cls: string; icon: string }> = {
  SCHEDULED: { label: "Planlandı", cls: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: "📅" },
  CONFIRMED: { label: "Onaylandı", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: "✅" },
  IN_PROGRESS: { label: "Devam Ediyor", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: "🔄" },
  COMPLETED: { label: "Tamamlandı", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: "✓" },
  CANCELLED: { label: "İptal", cls: "bg-red-500/10 text-red-400 border-red-500/20", icon: "✗" },
  NO_SHOW: { label: "Gelmedi", cls: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: "?" },
};

function getWeekDates(dateStr: string) {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 - 20:00

async function getAppointments(tenantId: string, date: string) {
  const weekDates = getWeekDates(date);
  const weekStart = new Date(weekDates[0]);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekDates[6]);
  weekEnd.setHours(23, 59, 59, 999);

  const [appointments, vets] = await Promise.all([
    db.appointment.findMany({
      where: {
        tenantId,
        startTime: { gte: weekStart, lte: weekEnd },
      },
      include: {
        pet: { select: { id: true, name: true, species: true, breed: true } },
        vet: { select: { id: true, firstName: true, lastName: true, title: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    db.user.findMany({
      where: { tenantId, isActive: true, role: { in: ["VET", "ADMIN", "OWNER"] } },
      select: { id: true, firstName: true, lastName: true, title: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  return { appointments, vets, weekDates };
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const { date: dateParam, view = "week" } = await searchParams;
  const today = new Date();
  const selectedDate = dateParam || today.toISOString().split("T")[0];
  const { appointments, vets, weekDates } = await getAppointments(session.user.tenantId, selectedDate);

  // Navigasyon tarihleri
  const prevWeek = new Date(weekDates[0]);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(weekDates[0]);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  // Bugünün randevuları (liste görünümü için)
  const todayDateStr = today.toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => {
    const d = new Date(a.startTime).toISOString().split("T")[0];
    return d === selectedDate;
  });

  // Haftalık istatistikler
  const totalWeekly = appointments.length;
  const completedWeekly = appointments.filter((a) => a.status === "COMPLETED").length;
  const cancelledWeekly = appointments.filter((a) => a.status === "CANCELLED").length;
  const todayCount = appointments.filter((a) => {
    const d = new Date(a.startTime).toISOString().split("T")[0];
    return d === todayDateStr;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Randevular</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {monthNames[weekDates[0].getMonth()]} {weekDates[0].getDate()} – {weekDates[6].getDate()}, {weekDates[0].getFullYear()}
          </p>
        </div>
        <Link
          href="/dashboard/appointments/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          Yeni Randevu
        </Link>
      </div>

      {/* Mini İstatistikler */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Bugün", value: todayCount, color: "blue" },
          { label: "Haftalık Toplam", value: totalWeekly, color: "violet" },
          { label: "Tamamlanan", value: completedWeekly, color: "emerald" },
          { label: "İptal Edilen", value: cancelledWeekly, color: "red" },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3.5">
            <div className={`text-xl font-bold ${
              stat.color === "blue" ? "text-blue-400" :
              stat.color === "violet" ? "text-violet-400" :
              stat.color === "emerald" ? "text-emerald-400" :
              "text-red-400"
            }`}>
              {stat.value}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Takvim Navigasyonu */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/appointments?date=${prevWeek.toISOString().split("T")[0]}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <Link
              href={`/dashboard/appointments?date=${todayDateStr}`}
              className="px-3 py-1 text-sm font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 rounded-lg transition-colors"
            >
              Bugün
            </Link>
            <Link
              href={`/dashboard/appointments?date=${nextWeek.toISOString().split("T")[0]}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {vets.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                <User className="w-3.5 h-3.5" />
                {vets.length} veteriner
              </div>
            )}
          </div>
        </div>

        {/* Haftalık Takvim Görünümü */}
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Gün başlıkları */}
            <div className="grid grid-cols-8 border-b border-slate-800/40">
              <div className="p-2 text-xs text-slate-600 text-center border-r border-slate-800/30">
                <Clock className="w-3.5 h-3.5 mx-auto" />
              </div>
              {weekDates.map((d, i) => {
                const isToday = d.toISOString().split("T")[0] === todayDateStr;
                const isSelected = d.toISOString().split("T")[0] === selectedDate;
                const dayAppointments = appointments.filter(
                  (a) => new Date(a.startTime).toISOString().split("T")[0] === d.toISOString().split("T")[0]
                );
                return (
                  <Link
                    key={i}
                    href={`/dashboard/appointments?date=${d.toISOString().split("T")[0]}`}
                    className={`p-2.5 text-center border-r border-slate-800/30 last:border-r-0 transition-all hover:bg-slate-800/30 ${
                      isSelected ? "bg-blue-500/5" : ""
                    }`}
                  >
                    <div className="text-xs text-slate-500 font-medium">{dayNames[i]}</div>
                    <div className={`text-lg font-bold mt-0.5 ${
                      isToday ? "text-blue-400" : isSelected ? "text-white" : "text-slate-300"
                    }`}>
                      {d.getDate()}
                    </div>
                    {dayAppointments.length > 0 && (
                      <div className="flex items-center justify-center gap-0.5 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${isToday ? "bg-blue-400" : "bg-slate-500"}`} />
                        <span className="text-[10px] text-slate-500">{dayAppointments.length}</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Zaman ızgarası */}
            {HOURS.map((hour) => {
              return (
                <div key={hour} className="grid grid-cols-8 border-b border-slate-800/20 min-h-[52px]">
                  <div className="p-1.5 text-xs text-slate-600 font-mono text-center border-r border-slate-800/30 flex items-start justify-center pt-2">
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                  {weekDates.map((d, dayIdx) => {
                    const dayStr = d.toISOString().split("T")[0];
                    const hourAppointments = appointments.filter((a) => {
                      const aDate = new Date(a.startTime);
                      return aDate.toISOString().split("T")[0] === dayStr && aDate.getHours() === hour;
                    });
                    
                    return (
                      <div
                        key={dayIdx}
                        className="border-r border-slate-800/30 last:border-r-0 p-0.5 relative"
                      >
                        {hourAppointments.map((appt) => {
                          const t = typeLabel[appt.type] || typeLabel.CHECKUP;
                          const time = new Date(appt.startTime);
                          return (
                            <Link
                              key={appt.id}
                              href={`/dashboard/patients/${appt.pet.id}`}
                              className={`block p-1.5 rounded-lg text-[10px] leading-tight mb-0.5 border transition-all hover:scale-[1.02] cursor-pointer ${t.color}`}
                            >
                              <div className="font-semibold truncate">
                                {time.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} {speciesIcon[appt.pet.species]} {appt.pet.name}
                              </div>
                              <div className="truncate opacity-70 mt-0.5">
                                {appt.vet.title || "Dr."} {appt.vet.lastName} · {t.label}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Seçili Günün Randevu Listesi */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            {new Date(selectedDate).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })} Randevuları
          </h2>
          <span className="text-xs text-slate-500">{todayAppointments.length} randevu</span>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-14 h-14 bg-slate-800/60 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">Bu tarihte randevu yok</p>
            <p className="text-slate-500 text-sm mt-1">Yeni randevu oluşturmak için butona tıklayın</p>
            <Link
              href="/dashboard/appointments/new"
              className="inline-flex items-center gap-2 mt-4 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Randevu Oluştur
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {todayAppointments.map((appt) => {
              const type = typeLabel[appt.type] || typeLabel.CHECKUP;
              const status = statusConfig[appt.status] || statusConfig.SCHEDULED;
              return (
                <div
                  key={appt.id}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-slate-800/20 transition-colors group"
                >
                  {/* Saat */}
                  <div className="flex-shrink-0 w-16 text-center">
                    <div className="text-sm font-mono font-semibold text-white">
                      {new Date(appt.startTime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="text-xs text-slate-500">{appt.duration} dk</div>
                  </div>

                  {/* Hayvan */}
                  <div className="text-2xl">{speciesIcon[appt.pet.species]}</div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/patients/${appt.pet.id}`}
                      className="text-sm font-medium text-white hover:text-blue-400 transition-colors"
                    >
                      {appt.pet.name}
                    </Link>
                    {appt.pet.breed && (
                      <span className="text-xs text-slate-500 ml-1.5">({appt.pet.breed})</span>
                    )}
                    {appt.reason && (
                      <div className="text-xs text-slate-500 mt-0.5 truncate">{appt.reason}</div>
                    )}
                  </div>

                  {/* Hekim */}
                  <div className="hidden sm:block text-right">
                    <div className="text-xs text-slate-400">
                      {appt.vet.title || "Dr."} {appt.vet.firstName} {appt.vet.lastName}
                    </div>
                  </div>

                  {/* Tür Badge */}
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium hidden md:inline-flex ${type.color}`}>
                    {type.label}
                  </span>

                  {/* Status Badge */}
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${status.cls}`}>
                    {status.icon} {status.label}
                  </span>

                  {/* Durum değiştirme*/}
                  <AppointmentStatusButton appointmentId={appt.id} currentStatus={appt.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

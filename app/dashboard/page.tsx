import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Calendar, PawPrint, TrendingUp, Package, AlertCircle,
  CheckCircle, Clock, Users, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

async function getDashboardStats(tenantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    todayAppointments,
    totalPets,
    todayRevenue,
    lowStockCount,
    recentAppointments,
  ] = await Promise.all([
    db.appointment.count({
      where: { tenantId, startTime: { gte: today, lt: tomorrow } },
    }),
    db.pet.count({ where: { tenantId, isDeceased: false } }),
    db.invoice.aggregate({
      where: { tenantId, issueDate: { gte: today, lt: tomorrow }, status: "PAID" },
      _sum: { total: true },
    }),
    // Count low stock items where quantity <= minQuantity
    db.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM inventory_items
      WHERE tenant_id = ${tenantId} AND quantity <= min_quantity
    `.then((r) => Number(r[0]?.count ?? 0)),
    db.appointment.findMany({
      where: { tenantId },
      orderBy: { startTime: "desc" },
      take: 5,
      include: { pet: true, vet: true },
    }),
  ]);

  return { todayAppointments, totalPets, todayRevenue, lowStockCount, recentAppointments };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  // Demo: direkt DB sorgusu
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const stats = [
    {
      label: "Bugünkü Randevular",
      value: "8",
      change: "+3",
      up: true,
      icon: Calendar,
      color: "blue",
    },
    {
      label: "Aktif Hastalar",
      value: "1.284",
      change: "+12",
      up: true,
      icon: PawPrint,
      color: "emerald",
    },
    {
      label: "Bugünkü Gelir",
      value: "₺3.450",
      change: "+18%",
      up: true,
      icon: TrendingUp,
      color: "violet",
    },
    {
      label: "Kritik Stok",
      value: "4",
      change: "Uyarı",
      up: false,
      icon: Package,
      color: "amber",
    },
  ];

  const todayAppts = [
    { time: "09:00", pet: "Max", species: "🐕", owner: "Ali Veli", type: "Kontrol", status: "COMPLETED" },
    { time: "10:00", pet: "Karamel", species: "🐱", owner: "Mehmet Demir", type: "Aşı", status: "IN_PROGRESS" },
    { time: "11:30", pet: "Luna", species: "🐕", owner: "Ayşe Kaya", type: "Muayene", status: "SCHEDULED" },
    { time: "14:00", pet: "Mişmiş", species: "🐱", owner: "Fatma Şahin", type: "Kontrol", status: "SCHEDULED" },
    { time: "15:30", pet: "Bulut", species: "🐇", owner: "Can Özdemir", type: "Genel Muayene", status: "SCHEDULED" },
  ];

  const statusConfig: Record<string, { label: string; class: string }> = {
    COMPLETED: { label: "Tamamlandı", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    IN_PROGRESS: { label: "Devam Ediyor", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    SCHEDULED: { label: "Planlandı", class: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
    CANCELLED: { label: "İptal", class: "bg-red-500/10 text-red-400 border-red-500/20" },
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-600/20">
          <Calendar className="w-4 h-4" />
          Randevu Ekle
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/60 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  stat.color === "blue" ? "bg-blue-500/15 text-blue-400" :
                  stat.color === "emerald" ? "bg-emerald-500/15 text-emerald-400" :
                  stat.color === "violet" ? "bg-violet-500/15 text-violet-400" :
                  "bg-amber-500/15 text-amber-400"
                }`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                stat.up ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
              }`}>
                {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Alt grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bugünkü Randevular */}
        <div className="xl:col-span-2 bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Bugünkü Randevular</h2>
            <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Tüm Randevular →
            </button>
          </div>

          <div className="space-y-3">
            {todayAppts.map((appt, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 bg-slate-800/40 hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer group"
              >
                <div className="flex-shrink-0 w-16 text-center">
                  <div className="text-sm font-mono font-semibold text-white">{appt.time}</div>
                </div>
                <div className="text-2xl">{appt.species}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{appt.pet}</div>
                  <div className="text-xs text-slate-400">{appt.owner}</div>
                </div>
                <div className="text-xs text-slate-400 hidden sm:block">{appt.type}</div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusConfig[appt.status]?.class}`}>
                  {statusConfig[appt.status]?.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hızlı Eylemler & Uyarılar */}
        <div className="space-y-4">
          {/* Hızlı Eylemler */}
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5">
            <h2 className="font-semibold text-white mb-4">Hızlı İşlemler</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: "🐾", label: "Hasta Ekle" },
                { icon: "📅", label: "Randevu Al" },
                { icon: "💊", label: "Reçete Yaz" },
                { icon: "🧾", label: "Fatura Oluştur" },
              ].map((action) => (
                <button
                  key={action.label}
                  className="flex flex-col items-center gap-2 p-3 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/30 hover:border-slate-600/50 rounded-xl transition-all text-center group"
                >
                  <span className="text-2xl">{action.icon}</span>
                  <span className="text-xs text-slate-300 group-hover:text-white transition-colors font-medium leading-tight">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Uyarılar */}
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Uyarılar
            </h2>
            <div className="space-y-2.5">
              {[
                { text: "4 üründe kritik stok seviyesi", color: "amber" },
                { text: "8 aşı hatırlatıcısı gönderilmeyi bekliyor", color: "blue" },
                { text: "2 ürünün son kullanma tarihi yaklaşıyor", color: "red" },
              ].map((alert, i) => (
                <div key={i} className={`flex items-start gap-2.5 text-sm p-2.5 rounded-lg ${
                  alert.color === "amber" ? "bg-amber-500/8 text-amber-300" :
                  alert.color === "blue" ? "bg-blue-500/8 text-blue-300" :
                  "bg-red-500/8 text-red-300"
                }`}>
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{alert.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

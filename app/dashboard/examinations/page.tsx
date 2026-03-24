import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Stethoscope, Plus, FileText, CheckCircle2,
  Clock, User, Search, Filter, ArrowRight,
  Activity, ClipboardList, PenTool,
} from "lucide-react";

const speciesIcon: Record<string, string> = {
  DOG: "🐕", CAT: "🐱", BIRD: "🐦", RABBIT: "🐇",
  REPTILE: "🦎", RODENT: "🐭", OTHER: "🐾",
};

const statusConfig: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  DRAFT: { label: "Taslak", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: PenTool },
  SIGNED: { label: "İmzalandı", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
};

export default async function ExaminationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const { status: statusFilter, search, page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1");

  // Build query
  const where: Record<string, unknown> = {
    tenantId: session.user.tenantId,
  };
  if (statusFilter && statusFilter !== "ALL") {
    where.status = statusFilter;
  }
  if (search) {
    where.pet = { name: { contains: search, mode: "insensitive" } };
  }

  const [examinations, total, todayCount, draftCount, signedCount] = await Promise.all([
    db.examination.findMany({
      where,
      include: {
        pet: { select: { id: true, name: true, species: true, breed: true } },
        vet: { select: { id: true, firstName: true, lastName: true, title: true } },
        appointment: { select: { id: true, type: true } },
        _count: { select: { prescription: true } },
      },
      orderBy: { examDate: "desc" },
      skip: (page - 1) * 20,
      take: 20,
    }),
    db.examination.count({ where }),
    db.examination.count({
      where: {
        tenantId: session.user.tenantId,
        examDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    db.examination.count({
      where: { tenantId: session.user.tenantId, status: "DRAFT" },
    }),
    db.examination.count({
      where: { tenantId: session.user.tenantId, status: "SIGNED" },
    }),
  ]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Muayeneler</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            SOAP tabanlı muayene kayıtları
          </p>
        </div>
        <Link
          href="/dashboard/examinations/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          Yeni Muayene
        </Link>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Bugün", value: todayCount, color: "blue", icon: Clock },
          { label: "Toplam", value: total, color: "violet", icon: ClipboardList },
          { label: "Taslak", value: draftCount, color: "amber", icon: PenTool },
          { label: "İmzalanan", value: signedCount, color: "emerald", icon: CheckCircle2 },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`w-4 h-4 ${
                stat.color === "blue" ? "text-blue-400" :
                stat.color === "violet" ? "text-violet-400" :
                stat.color === "amber" ? "text-amber-400" :
                "text-emerald-400"
              }`} />
            </div>
            <div className={`text-xl font-bold ${
              stat.color === "blue" ? "text-blue-400" :
              stat.color === "violet" ? "text-violet-400" :
              stat.color === "amber" ? "text-amber-400" :
              "text-emerald-400"
            }`}>
              {stat.value}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filtreler */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800/60 flex-wrap">
          {/* Arama */}
          <form className="relative flex-1 min-w-[200px]" action="/dashboard/examinations">
            <input
              type="text"
              name="search"
              placeholder="Hasta adı ile ara..."
              defaultValue={search || ""}
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2 pl-10 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          </form>

          {/* Durum filtresi */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            {[
              { key: "ALL", label: "Tümü" },
              { key: "DRAFT", label: "Taslak" },
              { key: "SIGNED", label: "İmzalandı" },
            ].map((f) => {
              const isActive = (statusFilter || "ALL") === f.key;
              return (
                <Link
                  key={f.key}
                  href={`/dashboard/examinations?status=${f.key}${search ? `&search=${search}` : ""}`}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    isActive
                      ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                  }`}
                >
                  {f.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Muayene Listesi */}
        {examinations.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-16 h-16 bg-slate-800/60 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium text-lg">Muayene kaydı bulunamadı</p>
            <p className="text-slate-500 text-sm mt-1">Yeni muayene başlatmak için butona tıklayın</p>
            <Link
              href="/dashboard/examinations/new"
              className="inline-flex items-center gap-2 mt-5 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Muayene Başlat
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {examinations.map((exam) => {
              const st = statusConfig[exam.status] || statusConfig.DRAFT;
              const StatusIcon = st.icon;
              const examDate = new Date(exam.examDate);
              return (
                <Link
                  key={exam.id}
                  href={`/dashboard/examinations/${exam.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/20 transition-colors group"
                >
                  {/* Tür ikonu */}
                  <div className="text-2xl flex-shrink-0">{speciesIcon[exam.pet.species]}</div>

                  {/* Hasta bilgisi */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {exam.pet.name}
                      </span>
                      {exam.pet.breed && (
                        <span className="text-xs text-slate-500">({exam.pet.breed})</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{examDate.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span>·</span>
                      <span>{examDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                      {exam.appointment && (
                        <>
                          <span>·</span>
                          <span className="text-blue-400/70">Randevulu</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Vital özet */}
                  {(exam.weight || exam.temperature) && (
                    <div className="hidden md:flex items-center gap-3 text-xs text-slate-500">
                      {exam.weight && (
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {exam.weight} kg
                        </span>
                      )}
                      {exam.temperature && (
                        <span>{exam.temperature}°C</span>
                      )}
                    </div>
                  )}

                  {/* Veteriner */}
                  <div className="hidden sm:block text-right flex-shrink-0">
                    <div className="text-xs text-slate-400">
                      {exam.vet.title || "Dr."} {exam.vet.firstName} {exam.vet.lastName}
                    </div>
                  </div>

                  {/* Reçete sayısı */}
                  {exam._count.prescription > 0 && (
                    <div className="hidden lg:flex items-center gap-1 text-xs text-violet-400/70">
                      <FileText className="w-3 h-3" />
                      {exam._count.prescription}
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium flex-shrink-0 ${st.cls}`}>
                    <StatusIcon className="w-3 h-3" />
                    {st.label}
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-4 h-4 text-slate-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800/60">
            <span className="text-xs text-slate-500">
              Toplam {total} muayene · Sayfa {page} / {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              {page > 1 && (
                <Link
                  href={`/dashboard/examinations?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}${search ? `&search=${search}` : ""}`}
                  className="px-3 py-1 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/40 rounded-lg transition-colors"
                >
                  Önceki
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/dashboard/examinations?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}${search ? `&search=${search}` : ""}`}
                  className="px-3 py-1 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/40 rounded-lg transition-colors"
                >
                  Sonraki
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

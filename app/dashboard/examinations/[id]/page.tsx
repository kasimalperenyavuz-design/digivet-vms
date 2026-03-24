import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Calendar, User, Activity,
  Scale, Thermometer, Heart, Wind,
  FileText, Stethoscope, Clock,
  PawPrint,
} from "lucide-react";
import ExaminationSOAPForm from "./ExaminationSOAPForm";
import ExamFileUploader from "@/components/files/ExamFileUploader";

const speciesIcon: Record<string, string> = {
  DOG: "🐕", CAT: "🐱", BIRD: "🐦", RABBIT: "🐇",
  REPTILE: "🦎", RODENT: "🐭", OTHER: "🐾",
};

const genderLabel: Record<string, string> = {
  MALE: "Erkek", FEMALE: "Dişi", UNKNOWN: "Bilinmiyor",
};

export default async function ExaminationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const { id } = await params;

  const examination = await db.examination.findFirst({
    where: { id, tenantId: session.user.tenantId },
    include: {
      pet: {
        select: {
          id: true, name: true, species: true, breed: true,
          gender: true, birthDate: true, color: true, microchip: true,
          isNeutered: true,
          owner: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
      },
      vet: {
        select: { id: true, firstName: true, lastName: true, title: true, diplomaNo: true },
      },
      appointment: {
        select: { id: true, type: true, status: true, startTime: true, reason: true },
      },
      prescription: {
        select: {
          id: true, status: true, issueDate: true,
          items: { select: { drugName: true, dosage: true } },
        },
      },
      files: true,
    },
  });

  if (!examination) notFound();

  const pet = examination.pet;
  const vet = examination.vet;
  const isSigned = examination.status === "SIGNED";

  // Pet yaş hesaplama
  let ageText = "";
  if (pet.birthDate) {
    const now = new Date();
    const birth = new Date(pet.birthDate);
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months >= 12) {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      ageText = `${years} yıl${remainingMonths > 0 ? ` ${remainingMonths} ay` : ""}`;
    } else {
      ageText = `${months} ay`;
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/examinations"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-blue-400" />
              Muayene Detayı
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {new Date(examination.examDate).toLocaleString("tr-TR")} · #{examination.id.slice(-6)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSigned && (
            <form action={async () => {
              "use server";
              const { createInvoiceFromExamination } = await import("@/app/actions/invoices");
              await createInvoiceFromExamination(examination.id);
            }}>
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600/90 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
              >
                📝 Faturaya Dönüştür
              </button>
            </form>
          )}

          {/* Status badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium ${
            isSigned
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }`}>
            {isSigned ? "✅ İmzalandı" : "📝 Taslak"}
            {isSigned && examination.signedAt && (
              <span className="text-xs opacity-60">
                · {new Date(examination.signedAt).toLocaleString("tr-TR")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon — Hasta Bilgileri + Vital + Bağlantılar */}
        <div className="space-y-4">
          {/* Hasta Kartı */}
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-800/80 rounded-xl flex items-center justify-center text-2xl">
                {speciesIcon[pet.species]}
              </div>
              <div>
                <Link
                  href={`/dashboard/patients/${pet.id}`}
                  className="text-lg font-bold text-white hover:text-blue-400 transition-colors"
                >
                  {pet.name}
                </Link>
                <div className="text-xs text-slate-500">
                  {pet.breed || "Irk belirtilmemiş"} · {genderLabel[pet.gender]}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {ageText && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{ageText}</span>
                </div>
              )}
              {pet.color && (
                <div className="flex items-center gap-2 text-slate-400">
                  <PawPrint className="w-3.5 h-3.5 text-slate-500" />
                  <span>{pet.color}</span>
                </div>
              )}
              {pet.microchip && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Activity className="w-3.5 h-3.5 text-slate-500" />
                  <span>Çip: {pet.microchip}</span>
                </div>
              )}
              {pet.isNeutered && (
                <div className="text-slate-500">✓ Kısırlaştırılmış</div>
              )}
            </div>

            {/* Sahip bilgisi */}
            <div className="mt-4 pt-3 border-t border-slate-800/40">
              <div className="text-xs text-slate-500 mb-1">Sahip</div>
              <div className="text-sm text-slate-300">{pet.owner.firstName} {pet.owner.lastName}</div>
              {pet.owner.phone && (
                <div className="text-xs text-slate-500 mt-0.5">{pet.owner.phone}</div>
              )}
            </div>
          </div>

          {/* Vital Bulgular */}
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5">
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Vital Bulgular
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Ağırlık", value: examination.weight, unit: "kg", icon: Scale, color: "blue" },
                { label: "Sıcaklık", value: examination.temperature, unit: "°C", icon: Thermometer, color: "red" },
                { label: "Kalp Atışı", value: examination.heartRate, unit: "bpm", icon: Heart, color: "pink" },
                { label: "Solunum", value: examination.respRate, unit: "/dk", icon: Wind, color: "cyan" },
                { label: "SpO₂", value: examination.spO2, unit: "%", icon: Activity, color: "emerald" },
              ].map((vital) => (
                <div key={vital.label} className="bg-slate-800/30 rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <vital.icon className={`w-3 h-3 ${
                      vital.color === "blue" ? "text-blue-400" :
                      vital.color === "red" ? "text-red-400" :
                      vital.color === "pink" ? "text-pink-400" :
                      vital.color === "cyan" ? "text-cyan-400" :
                      "text-emerald-400"
                    }`} />
                    <span className="text-[10px] text-slate-500">{vital.label}</span>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {vital.value != null ? `${vital.value} ${vital.unit}` : (
                      <span className="text-slate-600 font-normal text-xs">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Veteriner */}
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5">
            <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-violet-400" />
              Muayene Eden
            </h3>
            <div className="text-sm text-white">{vet.title || "Dr."} {vet.firstName} {vet.lastName}</div>
            {vet.diplomaNo && <div className="text-xs text-slate-500 mt-0.5">Diploma: {vet.diplomaNo}</div>}
          </div>

          {/* Randevu Bağlantısı */}
          {examination.appointment && (
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5">
              <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                Bağlı Randevu
              </h3>
              <div className="text-xs text-slate-400 space-y-1">
                <div>{new Date(examination.appointment.startTime).toLocaleString("tr-TR")}</div>
                <div>Tür: {examination.appointment.type}</div>
                {examination.appointment.reason && <div>Sebep: {examination.appointment.reason}</div>}
              </div>
            </div>
          )}

          {/* Reçeteler */}
          {examination.prescription.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5">
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-400" />
                Reçeteler ({examination.prescription.length})
              </h3>
              <div className="space-y-2">
                {examination.prescription.map((rx) => (
                  <div key={rx.id} className="bg-slate-800/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-300">
                        #{rx.id.slice(-6)}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        rx.status === "ISSUED"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : rx.status === "CANCELLED"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {rx.status === "ISSUED" ? "Düzenlendi" : rx.status === "CANCELLED" ? "İptal" : "Taslak"}
                      </span>
                    </div>
                    {rx.items.map((item, i) => (
                      <div key={i} className="text-xs text-slate-500">
                        {item.drugName} — {item.dosage}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Dosyalar & Yükleme */}
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5">
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              Tahlil & Röntgenler ({examination.files.length})
            </h3>
            
            {examination.files.length > 0 && (
              <div className="space-y-2 mb-4">
                {examination.files.map((file) => (
                  <a 
                    key={file.id} 
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-800/60 rounded-lg hover:bg-slate-800/80 hover:border-slate-700 transition-all group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate text-left">
                        <div className="text-xs font-medium text-slate-200 truncate">{file.name}</div>
                        <div className="text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
            
            {!isSigned && <ExamFileUploader examinationId={examination.id} />}
            {isSigned && examination.files.length === 0 && (
              <div className="text-xs text-slate-500 italic">Dosya yüklenmemiş</div>
            )}
          </div>
        </div>

        {/* Sağ Kolon — SOAP Düzenleme Formu */}
        <div className="lg:col-span-2">
          <ExaminationSOAPForm
            examination={{
              id: examination.id,
              subjective: examination.subjective,
              objective: examination.objective,
              assessment: examination.assessment,
              plan: examination.plan,
              diagnosisCodes: examination.diagnosisCodes,
              weight: examination.weight,
              temperature: examination.temperature,
              heartRate: examination.heartRate,
              respRate: examination.respRate,
              spO2: examination.spO2,
              status: examination.status,
            }}
          />
        </div>
      </div>
    </div>
  );
}

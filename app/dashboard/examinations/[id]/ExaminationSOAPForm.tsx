"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Save, CheckCircle2, Lock, AlertCircle,
  Scale, Thermometer, Heart, Wind, Activity,
} from "lucide-react";
import { updateExamination, signExamination } from "@/app/actions/examinations";

type ExaminationData = {
  id: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  diagnosisCodes: string[];
  weight: number | null;
  temperature: number | null;
  heartRate: number | null;
  respRate: number | null;
  spO2: number | null;
  status: string;
};

export default function ExaminationSOAPForm({
  examination,
}: {
  examination: ExaminationData;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"S" | "O" | "A" | "P">("S");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showSignConfirm, setShowSignConfirm] = useState(false);

  const isSigned = examination.status === "SIGNED";

  const soapTabs = [
    { key: "S" as const, label: "Subjective", desc: "Hasta sahibi şikayetleri", placeholder: "Hayvan sahibinin belirttiği şikayetler, semptomlar, süre, beslenme durumu..." },
    { key: "O" as const, label: "Objective", desc: "Fizik muayene bulguları", placeholder: "Fizik muayene bulguları, gözlemler, palpasyon sonuçları, genel durum..." },
    { key: "A" as const, label: "Assessment", desc: "Değerlendirme ve tanı", placeholder: "Ön tanı, ayırıcı tanı, teşhis kodları..." },
    { key: "P" as const, label: "Plan", desc: "Tedavi planı", placeholder: "Tedavi planı, ilaç önerileri, ameliyat planı, takip randevusu..." },
  ];

  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      setMessage(null);
      const result = await updateExamination(examination.id, formData);
      if (result.success) {
        setMessage({ type: "success", text: "Muayene başarıyla kaydedildi." });
        router.refresh();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: result.message || "Hata oluştu." });
      }
    });
  };

  const handleSign = () => {
    startTransition(async () => {
      setMessage(null);
      setShowSignConfirm(false);
      const result = await signExamination(examination.id);
      if (result.success) {
        setMessage({ type: "success", text: "Muayene imzalandı ve kilitlendi." });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error || "İmzalama hatası." });
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Mesaj */}
      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
          message.type === "success"
            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
            : "bg-red-500/10 border border-red-500/30 text-red-400"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <form action={handleSave}>
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl overflow-hidden">
          {/* İmzalı uyarısı */}
          {isSigned && (
            <div className="flex items-center gap-2 px-5 py-3 bg-emerald-500/5 border-b border-emerald-500/20 text-sm text-emerald-400">
              <Lock className="w-4 h-4" />
              Bu muayene imzalanmış ve kilitlenmiştir. Düzenleme yapılamaz.
            </div>
          )}

          {/* SOAP Tabs */}
          <div className="flex border-b border-slate-800/60">
            {soapTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${
                  activeTab === tab.key
                    ? "text-blue-400 bg-blue-500/5"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/30"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    activeTab === tab.key
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-slate-800 text-slate-500"
                  }`}>
                    {tab.key}
                  </span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </div>
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                )}
              </button>
            ))}
          </div>

          {/* SOAP Content */}
          {soapTabs.map((tab) => {
            const fieldName = tab.key === "S" ? "subjective" : tab.key === "O" ? "objective" : tab.key === "A" ? "assessment" : "plan";
            const defaultVal = examination[fieldName as keyof ExaminationData] as string | null;
            return (
              <div
                key={tab.key}
                className={activeTab === tab.key ? "block" : "hidden"}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-300">{tab.label}</h3>
                    <span className="text-xs text-slate-600">{tab.desc}</span>
                  </div>
                  <textarea
                    name={fieldName}
                    rows={14}
                    defaultValue={defaultVal || ""}
                    placeholder={tab.placeholder}
                    disabled={isSigned}
                    className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/30 resize-none transition-all leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            );
          })}

          {/* Vital Bulgular (düzenlenebilir) */}
          <div className="border-t border-slate-800/60 p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Vital Bulgular
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { name: "weight", label: "Ağırlık", unit: "kg", icon: Scale, value: examination.weight, step: "0.1" },
                { name: "temperature", label: "Sıcaklık", unit: "°C", icon: Thermometer, value: examination.temperature, step: "0.1" },
                { name: "heartRate", label: "Kalp", unit: "bpm", icon: Heart, value: examination.heartRate, step: "1" },
                { name: "respRate", label: "Solunum", unit: "/dk", icon: Wind, value: examination.respRate, step: "1" },
                { name: "spO2", label: "SpO₂", unit: "%", icon: Activity, value: examination.spO2, step: "0.1" },
              ].map((vital) => (
                <div key={vital.name}>
                  <label className="text-[10px] text-slate-500 mb-1 block flex items-center gap-1">
                    <vital.icon className="w-3 h-3" />
                    {vital.label}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name={vital.name}
                      step={vital.step}
                      defaultValue={vital.value ?? ""}
                      disabled={isSigned}
                      className="w-full bg-slate-800/40 border border-slate-700/40 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-600">{vital.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Teşhis Kodları */}
          <div className="border-t border-slate-800/60 p-4">
            <label className="text-sm font-medium text-slate-300 mb-2 block">Teşhis Kodları</label>
            <input
              type="text"
              name="diagnosisCodes"
              defaultValue={examination.diagnosisCodes.join(", ")}
              placeholder="Ör: K29.0, J06.9 (virgülle ayırın)"
              disabled={isSigned}
              className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Actions */}
        {!isSigned && (
          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setShowSignConfirm(true)}
              disabled={isPending}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              İmzala ve Kilitle
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20 disabled:shadow-none"
            >
              <Save className="w-4 h-4" />
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        )}
      </form>

      {/* İmzalama Onay Dialogu */}
      {showSignConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Lock className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">Muayeneyi İmzala</h3>
            <p className="text-sm text-slate-400 text-center mb-6">
              İmzaladıktan sonra bu muayene kaydı kilitlenecek ve düzenlenemeyecektir. Devam etmek istiyor musunuz?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSign}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors"
              >
                {isPending ? "İmzalanıyor..." : "Evet, İmzala"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

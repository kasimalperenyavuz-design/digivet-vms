"use client";

import { useActionState, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Search, Stethoscope, Thermometer,
  Heart, Wind, Activity, Scale, Save,
  Calendar, User, ChevronDown,
} from "lucide-react";
import { createExamination, type ExaminationFormState } from "@/app/actions/examinations";

const speciesIcon: Record<string, string> = {
  DOG: "🐕", CAT: "🐱", BIRD: "🐦", RABBIT: "🐇",
  REPTILE: "🦎", RODENT: "🐭", OTHER: "🐾",
};

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  owner: { firstName: string; lastName: string };
};

type Vet = {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
};

type Appointment = {
  id: string;
  type: string;
  reason: string | null;
  startTime: Date;
  pet: { id: string; name: string; species: string };
  vet: { id: string; firstName: string; lastName: string; title: string | null };
} | null;

export default function NewExaminationForm({
  pets,
  vets,
  appointment,
  preselectedPetId,
  preselectedVetId,
  currentVetId,
}: {
  pets: Pet[];
  vets: Vet[];
  appointment: Appointment;
  preselectedPetId?: string;
  preselectedVetId?: string;
  currentVetId: string;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ExaminationFormState, FormData>(
    createExamination,
    {}
  );
  const [petSearch, setPetSearch] = useState("");
  const [selectedPetId, setSelectedPetId] = useState(preselectedPetId || "");
  const [selectedVetId, setSelectedVetId] = useState(preselectedVetId || currentVetId);
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  const [activeSOAPTab, setActiveSOAPTab] = useState<"S" | "O" | "A" | "P">("S");

  const filteredPets = useMemo(() => {
    if (!petSearch) return pets.slice(0, 20);
    const q = petSearch.toLowerCase();
    return pets.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.owner.firstName.toLowerCase().includes(q) ||
        p.owner.lastName.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [pets, petSearch]);

  const selectedPet = pets.find((p) => p.id === selectedPetId);

  // Redirect on success
  if (state.success && state.examinationId) {
    router.push(`/dashboard/examinations/${state.examinationId}`);
  }

  const soapTabs = [
    { key: "S" as const, label: "Subjective", desc: "Hasta sahibi şikayetleri", placeholder: "Hayvan sahibinin belirttiği şikayetler, semptomlar, süre, beslenme durumu..." },
    { key: "O" as const, label: "Objective", desc: "Fizik muayene bulguları", placeholder: "Fizik muayene bulguları, gözlemler, palpasyon sonuçları, genel durum..." },
    { key: "A" as const, label: "Assessment", desc: "Değerlendirme ve tanı", placeholder: "Ön tanı, ayırıcı tanı, teşhis kodları..." },
    { key: "P" as const, label: "Plan", desc: "Tedavi planı", placeholder: "Tedavi planı, ilaç önerileri, ameliyat planı, takip randevusu..." },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/examinations"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Yeni Muayene</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {appointment ? `Randevu #${appointment.id.slice(-6)} üzerinden` : "Yeni muayene kaydı oluşturun"}
          </p>
        </div>
      </div>

      {/* Hata mesajı */}
      {state.message && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        {appointment && (
          <input type="hidden" name="appointmentId" value={appointment.id} />
        )}
        <input type="hidden" name="petId" value={selectedPetId} />
        <input type="hidden" name="vetId" value={selectedVetId} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Kolon — Hasta & Veteriner Seçimi + Vital */}
          <div className="space-y-4">
            {/* Randevu bilgisi */}
            {appointment && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
                  <Calendar className="w-4 h-4" />
                  Randevu Bilgisi
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>{new Date(appointment.startTime).toLocaleString("tr-TR")}</div>
                  {appointment.reason && <div>Sebep: {appointment.reason}</div>}
                </div>
              </div>
            )}

            {/* Hasta Seçimi */}
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
              <label className="text-sm font-medium text-slate-300 mb-2 block">Hasta *</label>
              {appointment ? (
                <div className="flex items-center gap-2 bg-slate-800/40 rounded-lg p-3">
                  <span className="text-lg">{speciesIcon[appointment.pet.species]}</span>
                  <span className="text-sm font-medium text-white">{appointment.pet.name}</span>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Hasta ara..."
                      value={selectedPet ? `${speciesIcon[selectedPet.species]} ${selectedPet.name}` : petSearch}
                      onChange={(e) => {
                        setPetSearch(e.target.value);
                        setSelectedPetId("");
                        setShowPetDropdown(true);
                      }}
                      onFocus={() => setShowPetDropdown(true)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  </div>
                  {showPetDropdown && !selectedPetId && (
                    <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {filteredPets.map((pet) => (
                        <button
                          key={pet.id}
                          type="button"
                          onClick={() => {
                            setSelectedPetId(pet.id);
                            setPetSearch("");
                            setShowPetDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-700/50 flex items-center gap-2 transition-colors text-sm"
                        >
                          <span>{speciesIcon[pet.species]}</span>
                          <div>
                            <div className="text-white font-medium">{pet.name}</div>
                            <div className="text-xs text-slate-500">{pet.owner.firstName} {pet.owner.lastName} · {pet.breed || ""}</div>
                          </div>
                        </button>
                      ))}
                      {filteredPets.length === 0 && (
                        <div className="px-4 py-3 text-xs text-slate-500">Sonuç bulunamadı</div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {state.errors?.petId && (
                <p className="text-red-400 text-xs mt-1">{state.errors.petId[0]}</p>
              )}
            </div>

            {/* Veteriner Seçimi */}
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
              <label className="text-sm font-medium text-slate-300 mb-2 block">Veteriner Hekim *</label>
              <div className="relative">
                <select
                  value={selectedVetId}
                  onChange={(e) => setSelectedVetId(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 appearance-none transition-all"
                >
                  <option value="">Hekim seçin</option>
                  {vets.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title || "Dr."} {v.firstName} {v.lastName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Vital Bulgular */}
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Vital Bulgular
              </h3>
              <div className="space-y-3">
                {[
                  { name: "weight", label: "Ağırlık", unit: "kg", icon: Scale, step: "0.1", placeholder: "Ör: 12.5" },
                  { name: "temperature", label: "Sıcaklık", unit: "°C", icon: Thermometer, step: "0.1", placeholder: "Ör: 38.5" },
                  { name: "heartRate", label: "Kalp Atışı", unit: "bpm", icon: Heart, step: "1", placeholder: "Ör: 120" },
                  { name: "respRate", label: "Solunum", unit: "/dk", icon: Wind, step: "1", placeholder: "Ör: 20" },
                  { name: "spO2", label: "SpO₂", unit: "%", icon: Activity, step: "0.1", placeholder: "Ör: 98" },
                ].map((vital) => (
                  <div key={vital.name} className="flex items-center gap-2">
                    <vital.icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <label className="text-xs text-slate-400 w-20 flex-shrink-0">{vital.label}</label>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        name={vital.name}
                        step={vital.step}
                        placeholder={vital.placeholder}
                        className="w-full bg-slate-800/40 border border-slate-700/40 rounded-lg px-3 py-1.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">{vital.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sağ Kolon — SOAP Formu */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl overflow-hidden">
              {/* SOAP Tabs */}
              <div className="flex border-b border-slate-800/60">
                {soapTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveSOAPTab(tab.key)}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${
                      activeSOAPTab === tab.key
                        ? "text-blue-400 bg-blue-500/5"
                        : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/30"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                        activeSOAPTab === tab.key
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-slate-800 text-slate-500"
                      }`}>
                        {tab.key}
                      </span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </div>
                    {activeSOAPTab === tab.key && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                    )}
                  </button>
                ))}
              </div>

              {/* SOAP Content */}
              {soapTabs.map((tab) => (
                <div
                  key={tab.key}
                  className={activeSOAPTab === tab.key ? "block" : "hidden"}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-slate-300">{tab.label}</h3>
                      <span className="text-xs text-slate-600">{tab.desc}</span>
                    </div>
                    <textarea
                      name={tab.key === "S" ? "subjective" : tab.key === "O" ? "objective" : tab.key === "A" ? "assessment" : "plan"}
                      rows={12}
                      placeholder={tab.placeholder}
                      className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/30 resize-none transition-all leading-relaxed"
                    />
                  </div>
                </div>
              ))}

              {/* Teşhis Kodları */}
              <div className="border-t border-slate-800/60 p-4">
                <label className="text-sm font-medium text-slate-300 mb-2 block">Teşhis Kodları</label>
                <input
                  type="text"
                  name="diagnosisCodes"
                  placeholder="Ör: K29.0, J06.9 (virgülle ayırın)"
                  className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/dashboard/examinations"
            className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={isPending || !selectedPetId || !selectedVetId}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20 disabled:shadow-none"
          >
            <Save className="w-4 h-4" />
            {isPending ? "Kaydediliyor..." : "Taslak Olarak Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}

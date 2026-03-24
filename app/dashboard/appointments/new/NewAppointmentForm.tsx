"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAppointment, type AppointmentFormState } from "@/app/actions/appointments";
import { toast } from "sonner";
import {
  ChevronLeft, Calendar, Clock, User, PawPrint,
  Loader2, AlertCircle, Search, Stethoscope,
} from "lucide-react";

const speciesIcon: Record<string, string> = {
  DOG: "🐕", CAT: "🐱", BIRD: "🐦", RABBIT: "🐇",
  REPTILE: "🦎", RODENT: "🐭", OTHER: "🐾",
};

const appointmentTypes = [
  { value: "CHECKUP", label: "Kontrol", icon: "🩺", desc: "Genel sağlık kontrolü" },
  { value: "VACCINATION", label: "Aşı", icon: "💉", desc: "Aşılama işlemi" },
  { value: "SURGERY", label: "Ameliyat", icon: "🏥", desc: "Cerrahi müdahale" },
  { value: "GROOMING", label: "Tıraş / Bakım", icon: "✂️", desc: "Tıraş ve bakım" },
  { value: "LAB", label: "Laboratuvar", icon: "🔬", desc: "Laboratuvar tetkikleri" },
  { value: "EMERGENCY", label: "Acil", icon: "🚨", desc: "Acil müdahale" },
  { value: "FOLLOWUP", label: "Takip", icon: "🔄", desc: "Kontrol muayenesi" },
];

const durationOptions = [
  { value: 15, label: "15 dk" },
  { value: 30, label: "30 dk" },
  { value: 45, label: "45 dk" },
  { value: 60, label: "1 saat" },
  { value: 90, label: "1.5 saat" },
  { value: 120, label: "2 saat" },
];

const timeSlots = Array.from({ length: 25 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const minute = i % 2 === 0 ? "00" : "30";
  if (hour > 20) return null;
  return `${hour.toString().padStart(2, "0")}:${minute}`;
}).filter(Boolean) as string[];

type PetData = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  ownerName: string;
  ownerPhone: string;
};

type VetData = {
  id: string;
  name: string;
};

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msgs = errors?.[field];
  if (!msgs?.length) return null;
  return (
    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {msgs[0]}
    </p>
  );
}

const initialState: AppointmentFormState = {};

export default function NewAppointmentForm({
  pets,
  vets,
  preselectedPetId,
}: {
  pets: PetData[];
  vets: VetData[];
  preselectedPetId?: string;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createAppointment, initialState);
  const [petSearch, setPetSearch] = useState("");
  const [selectedPetId, setSelectedPetId] = useState(preselectedPetId || "");
  const [selectedType, setSelectedType] = useState("CHECKUP");
  const [showPetDropdown, setShowPetDropdown] = useState(false);

  const filteredPets = pets.filter(
    (p) =>
      p.name.toLowerCase().includes(petSearch.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(petSearch.toLowerCase()) ||
      p.ownerPhone.includes(petSearch)
  );

  const selectedPet = pets.find((p) => p.id === selectedPetId);

  useEffect(() => {
    if (state.success && state.appointmentId) {
      toast.success("Randevu başarıyla oluşturuldu!");
      router.push("/dashboard/appointments");
    }
    if (state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  // Bugünün tarihi (form default)
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/appointments"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Yeni Randevu</h1>
          <p className="text-slate-400 text-sm mt-0.5">Hasta ve randevu bilgilerini girin</p>
        </div>
      </div>

      <form action={formAction} className="space-y-6">
        {/* Hidden fields */}
        <input type="hidden" name="petId" value={selectedPetId} />
        <input type="hidden" name="type" value={selectedType} />

        {/* HASTA SEÇİMİ */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-emerald-500/15 rounded-lg flex items-center justify-center">
              <PawPrint className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="font-semibold text-white">Hasta Seçimi</h2>
          </div>

          {/* Seçili hasta */}
          {selectedPet ? (
            <div className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl mb-3">
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {speciesIcon[selectedPet.species]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{selectedPet.name}</div>
                <div className="text-xs text-slate-400">
                  {selectedPet.breed && `${selectedPet.breed} · `}Sahip: {selectedPet.ownerName}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedPetId(""); setPetSearch(""); }}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-all"
              >
                Değiştir
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Hasta adı, sahip adı veya telefon ile ara..."
                value={petSearch}
                onChange={(e) => { setPetSearch(e.target.value); setShowPetDropdown(true); }}
                onFocus={() => setShowPetDropdown(true)}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />

              {showPetDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowPetDropdown(false)} />
                  <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {filteredPets.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">
                        Sonuç bulunamadı
                      </div>
                    ) : (
                      filteredPets.slice(0, 15).map((pet) => (
                        <button
                          type="button"
                          key={pet.id}
                          onClick={() => {
                            setSelectedPetId(pet.id);
                            setPetSearch("");
                            setShowPetDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/60 transition-all text-left"
                        >
                          <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-base flex-shrink-0">
                            {speciesIcon[pet.species]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{pet.name}</div>
                            <div className="text-xs text-slate-400 truncate">
                              {pet.breed && `${pet.breed} · `}{pet.ownerName} · {pet.ownerPhone}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <FieldError errors={state.errors} field="petId" />
        </div>

        {/* RANDEVU TİPİ */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-violet-500/15 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-violet-400" />
            </div>
            <h2 className="font-semibold text-white">Randevu Tipi</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {appointmentTypes.map((type) => (
              <button
                type="button"
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                  selectedType === type.value
                    ? "bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20"
                    : "bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50"
                }`}
              >
                <span className="text-xl">{type.icon}</span>
                <span className={`text-xs font-medium ${
                  selectedType === type.value ? "text-blue-300" : "text-slate-300"
                }`}>
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* TARİH & SAAT & HEKİM */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-blue-500/15 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="font-semibold text-white">Tarih & Saat</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tarih */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                Tarih <span className="text-red-400">*</span>
              </label>
              <input
                name="date"
                type="date"
                defaultValue={today}
                min={today}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
              <FieldError errors={state.errors} field="date" />
            </div>

            {/* Saat */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Saat <span className="text-red-400">*</span>
                </span>
              </label>
              <select
                name="time"
                defaultValue="09:00"
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              >
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              <FieldError errors={state.errors} field="time" />
            </div>

            {/* Süre */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">Süre</label>
              <div className="flex gap-1.5 flex-wrap">
                {durationOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-xl cursor-pointer hover:border-slate-600 transition-all text-xs text-slate-300 font-medium"
                  >
                    <input
                      type="radio"
                      name="duration"
                      value={opt.value}
                      defaultChecked={opt.value === 30}
                      className="text-blue-500"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Veteriner Hekim */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Veteriner Hekim <span className="text-red-400">*</span>
                </span>
              </label>
              <select
                name="vetId"
                defaultValue=""
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              >
                <option value="" disabled>
                  Hekim seçin
                </option>
                {vets.map((vet) => (
                  <option key={vet.id} value={vet.id}>
                    {vet.name}
                  </option>
                ))}
              </select>
              <FieldError errors={state.errors} field="vetId" />
            </div>
          </div>
        </div>

        {/* NOTLAR */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">Randevu Sebebi</label>
              <input
                name="reason"
                type="text"
                placeholder="Ör: Aşı kontrolü, kusma şikayeti..."
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">Notlar</label>
              <input
                name="notes"
                type="text"
                placeholder="Ek bilgiler..."
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <Link
            href="/dashboard/appointments"
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm font-medium"
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={isPending || !selectedPetId}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                Randevu Oluştur
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

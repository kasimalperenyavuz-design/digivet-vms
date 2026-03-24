"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerPetWithOwner, type RegisterFormState } from "@/app/actions/patients";
import { toast } from "sonner";
import {
  User, Phone, Mail, MapPin, Shield, PawPrint,
  ChevronLeft, Loader2, AlertCircle,
} from "lucide-react";
import Link from "next/link";

const initialState: RegisterFormState = {};

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msgs = errors?.[field];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{msgs[0]}</p>;
}

export default function NewPatientPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(registerPetWithOwner, initialState);

  useEffect(() => {
    if (state.success && state.petId) {
      toast.success("Hasta başarıyla kaydedildi!");
      router.push(`/dashboard/patients/${state.petId}`);
    }
    if (state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/patients"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Yeni Hasta Kaydı</h1>
          <p className="text-slate-400 text-sm mt-0.5">Hayvan sahibi ve hasta bilgilerini girin</p>
        </div>
      </div>

      <form action={formAction} className="space-y-6">
        {/* SAHİP BİLGİLERİ */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-blue-500/15 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="font-semibold text-white">Hayvan Sahibi Bilgileri</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ad */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">Ad <span className="text-red-400">*</span></label>
              <input
                name="ownerFirstName"
                type="text"
                placeholder="Mehmet"
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
              <FieldError errors={state.errors} field="ownerFirstName" />
            </div>

            {/* Soyad */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">Soyad <span className="text-red-400">*</span></label>
              <input
                name="ownerLastName"
                type="text"
                placeholder="Demir"
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
              <FieldError errors={state.errors} field="ownerLastName" />
            </div>

            {/* Telefon */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Telefon <span className="text-red-400">*</span></span>
              </label>
              <input
                name="ownerPhone"
                type="tel"
                placeholder="0533 123 45 67"
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
              <FieldError errors={state.errors} field="ownerPhone" />
            </div>

            {/* E-posta */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> E-posta</span>
              </label>
              <input
                name="ownerEmail"
                type="email"
                placeholder="ornek@email.com"
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>

            {/* TC No */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">TC Kimlik No (İsteğe Bağlı)</label>
              <input
                name="ownerTcNo"
                type="text"
                placeholder="11111111111"
                maxLength={11}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono"
              />
            </div>

            {/* İl */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> İl</span>
              </label>
              <input
                name="ownerCity"
                type="text"
                placeholder="İstanbul"
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          {/* KVKK */}
          <div className="mt-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                name="kvkkConsent"
                type="checkbox"
                required
                className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  KVKK Açık Rıza Onayı <span className="text-red-400">*</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Kişisel verilerimin 6698 sayılı KVKK kapsamında işlenmesine ve saklanmasına açık rıza veriyorum.
                  Verilerimin üçüncü şahıslarla veteriner sağlık hizmetleri amacıyla paylaşılabileceğini kabul ediyorum.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* HAYVAN BİLGİLERİ */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-emerald-500/15 rounded-lg flex items-center justify-center">
              <PawPrint className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="font-semibold text-white">Hayvan (Hasta) Bilgileri</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hayvan adı */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">Hayvan Adı <span className="text-red-400">*</span></label>
              <input
                name="petName"
                type="text"
                placeholder="Karamel"
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
              <FieldError errors={state.errors} field="petName" />
            </div>

            {/* Tür */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">Tür <span className="text-red-400">*</span></label>
              <select
                name="petSpecies"
                defaultValue=""
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              >
                <option value="" disabled>Tür Seçin</option>
                <option value="DOG">🐕 Köpek</option>
                <option value="CAT">🐱 Kedi</option>
                <option value="BIRD">🐦 Kuş</option>
                <option value="RABBIT">🐇 Tavşan</option>
                <option value="REPTILE">🦎 Sürüngen</option>
                <option value="RODENT">🐭 Kemirgen</option>
                <option value="OTHER">🐾 Diğer</option>
              </select>
              <FieldError errors={state.errors} field="petSpecies" />
            </div>

            {/* Irk */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">Irk</label>
              <input
                name="petBreed"
                type="text"
                placeholder="British Shorthair"
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>

            {/* Cinsiyet */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">Cinsiyet</label>
              <div className="flex gap-2">
                {[
                  { value: "MALE", label: "♂ Erkek" },
                  { value: "FEMALE", label: "♀ Dişi" },
                  { value: "UNKNOWN", label: "? Bilinmiyor" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-1.5 flex-1 p-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl cursor-pointer hover:border-slate-600 transition-all text-xs text-slate-300 font-medium"
                  >
                    <input type="radio" name="petGender" value={opt.value} defaultChecked={opt.value === "UNKNOWN"} className="text-blue-500" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Doğum tarihi */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">Doğum Tarihi (yaklaşık)</label>
              <input
                name="petBirthDate"
                type="date"
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>

            {/* Renk */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">Renk / İşaret</label>
              <input
                name="petColor"
                type="text"
                placeholder="Gri-Bej, beyaz benekli"
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>

            {/* Çip No */}
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">Mikroçip Numarası (15 hane)</label>
              <input
                name="petMicrochip"
                type="text"
                placeholder="941000024680135"
                maxLength={15}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono"
              />
            </div>

            {/* Kısırlaştırma */}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  name="petIsNeutered"
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-300">Kısırlaştırılmış / Sterilize</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <Link
            href="/dashboard/patients"
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm font-medium"
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <PawPrint className="w-4 h-4" />
                Hasta Kaydını Oluştur
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, PawPrint, Loader2 } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("E-posta veya şifre hatalı!");
      } else {
        toast.success("Giriş başarılı!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Bir hata oluştu, lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gradient-bg)" }}>
      {/* Sol Panel — Marka */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: "linear-gradient(135deg, #0f6fec 0%, #0a4fa8 50%, #1a1a2e 100%)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <PawPrint className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-2xl font-bold tracking-tight">DigiVet VMS</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Veteriner Kliniğinizi<br />
            <span className="text-blue-200">Dijitalleştirin</span>
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed mb-8">
            Hasta yönetimi, randevu, reçete, stok ve faturalama — hepsi tek platformda.
          </p>

          {/* Feature Cards */}
          <div className="space-y-3">
            {[
              { icon: "🐾", text: "Hasta & Sahip Yönetimi" },
              { icon: "📅", text: "Akıllı Randevu Takvimi" },
              { icon: "💊", text: "Dijital Reçete & ATS Entegrasyonu" },
              { icon: "🏛️", text: "VETBİS & E-Fatura Entegrasyonu" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-white/90 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-200/60 text-sm">
          © 2025 DigiVet VMS · Türkiye&apos;nin veteriner klinik yönetim platformu
        </p>
      </div>

      {/* Sağ Panel — Login Formu */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
        <div className="w-full max-w-md">
          {/* Mobil Logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <PawPrint className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-2xl font-bold">DigiVet VMS</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Hoş Geldiniz</h2>
            <p className="text-slate-400">Klinik hesabınıza giriş yapın</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* E-posta */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                E-posta Adresi
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="info@kliniginiz.com"
                autoComplete="email"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Şifre
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Giriş Butonu */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </button>
          </form>

          {/* Demo Bilgileri */}
          <div className="mt-8 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Demo Hesaplar</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Admin:</span>
                <span className="text-slate-300 font-mono">admin@demo.com / digivet123</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Veteriner:</span>
                <span className="text-slate-300 font-mono">vet@demo.com / digivet123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

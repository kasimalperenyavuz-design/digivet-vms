"use client";

import { updateAppointmentStatus } from "@/app/actions/appointments";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

const statusTransitions: Record<string, { label: string; next: string; cls: string }[]> = {
  SCHEDULED: [
    { label: "Onayla", next: "CONFIRMED", cls: "text-blue-400 hover:bg-blue-500/10" },
    { label: "İptal Et", next: "CANCELLED", cls: "text-red-400 hover:bg-red-500/10" },
    { label: "Gelmedi", next: "NO_SHOW", cls: "text-slate-400 hover:bg-slate-500/10" },
  ],
  CONFIRMED: [
    { label: "Başlat", next: "IN_PROGRESS", cls: "text-amber-400 hover:bg-amber-500/10" },
    { label: "İptal Et", next: "CANCELLED", cls: "text-red-400 hover:bg-red-500/10" },
    { label: "Gelmedi", next: "NO_SHOW", cls: "text-slate-400 hover:bg-slate-500/10" },
  ],
  IN_PROGRESS: [
    { label: "Tamamla", next: "COMPLETED", cls: "text-emerald-400 hover:bg-emerald-500/10" },
  ],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export default function AppointmentStatusButton({
  appointmentId,
  currentStatus,
}: {
  appointmentId: string;
  currentStatus: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const transitions = statusTransitions[currentStatus] || [];
  if (transitions.length === 0) return null;

  const handleStatusChange = (newStatus: string) => {
    setIsOpen(false);
    startTransition(async () => {
      const result = await updateAppointmentStatus(appointmentId, newStatus);
      if (result.success) {
        toast.success("Randevu durumu güncellendi");
      } else {
        toast.error(result.error || "Bir hata oluştu");
      }
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-50"
      >
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-xl min-w-[140px] overflow-hidden">
            {transitions.map((t) => (
              <button
                key={t.next}
                onClick={() => handleStatusChange(t.next)}
                className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${t.cls}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

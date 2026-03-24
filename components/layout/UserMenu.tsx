"use client";

import { LogOut, User, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
    avatarUrl?: string;
  };
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Klinik Sahibi",
  ADMIN: "Yönetici",
  VET: "Veteriner Hekim",
  ASSISTANT: "Vet. Teknikeri",
  RECEPTIONIST: "Resepsiyon",
};

export default function UserMenu({ user }: UserMenuProps) {
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800/60 transition-all cursor-pointer group">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-md shadow-blue-600/20">
        {user.avatarUrl ? (
          <Image src={user.avatarUrl} alt="Avatar" width={32} height={32} className="rounded-lg" />
        ) : (
          initials
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{user.name}</div>
        <div className="text-xs text-slate-500 truncate">
          {user.role ? ROLE_LABELS[user.role] || user.role : ""}
        </div>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400 text-slate-500 rounded"
        title="Çıkış Yap"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  LayoutDashboard, Calendar, PawPrint, Stethoscope,
  Pill, Package, FileText, BarChart3, Settings,
  PawPrintIcon, Bell, ChevronRight,
} from "lucide-react";
import UserMenu from "@/components/layout/UserMenu";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/appointments", icon: Calendar, label: "Randevular" },
  { href: "/dashboard/patients", icon: PawPrint, label: "Hastalar" },
  { href: "/dashboard/examinations", icon: Stethoscope, label: "Muayeneler" },
  { href: "/dashboard/prescriptions", icon: Pill, label: "Reçeteler" },
  { href: "/dashboard/inventory", icon: Package, label: "Stok" },
  { href: "/dashboard/invoices", icon: FileText, label: "Faturalar" },
  { href: "/dashboard/reports", icon: BarChart3, label: "Raporlar" },
  { href: "/dashboard/settings", icon: Settings, label: "Ayarlar" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-800/60 flex flex-col bg-slate-900/50 backdrop-blur-xl">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800/60">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:bg-blue-500 transition-colors">
              <PawPrintIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-none">DigiVet VMS</div>
              <div className="text-slate-500 text-xs leading-none mt-0.5">{session.user.tenantName}</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-150 group text-sm font-medium"
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{item.label}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 -translate-x-1 group-hover:opacity-40 group-hover:translate-x-0 transition-all" />
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-slate-800/60">
          <UserMenu user={session.user} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-800/60 flex items-center px-6 gap-4 bg-slate-900/30 backdrop-blur-xl flex-shrink-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Hasta, sahip veya çip numarası ara..."
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2 pl-10 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  CalendarDays,
  MessageSquare,
  Palmtree,
  Settings,
  BarChart3,
} from "lucide-react";

const nav = [
  { href: "/", label: "Resumen", icon: BarChart3 },
  { href: "/horarios", label: "Horarios", icon: CalendarDays },
  { href: "/empleados", label: "Empleados", icon: Users },
  { href: "/solicitudes", label: "Solicitudes", icon: MessageSquare },
  { href: "/vacaciones", label: "Vacaciones", icon: Palmtree },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">Horario Bar</h1>
          <p className="text-xs text-gray-500 mt-0.5">Gestión de turnos</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">Barcelona, Cataluña</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}

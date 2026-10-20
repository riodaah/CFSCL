"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  Bell,
  Boxes,
  CalendarDays,
  Factory,
  Handshake,
  LayoutDashboard,
  Menu,
  Settings,
  Ship,
  Sprout,
  Users,
  X,
} from "lucide-react";
import { HOY, TEMPORADA_ACTUAL } from "@/lib/params";
import { fechaLarga } from "@/lib/format";

const NAV = [
  { grupo: "General", items: [{ href: "/", label: "Inicio", icon: LayoutDashboard }] },
  {
    grupo: "1 · Productores",
    items: [
      { href: "/productores", label: "Productores y exportadoras", icon: Sprout },
      { href: "/productores/pagos", label: "Pagos a productores", icon: CalendarDays },
    ],
  },
  { grupo: "2 · Proceso", items: [{ href: "/proceso", label: "Proceso y embalaje", icon: Factory }] },
  {
    grupo: "3 · Clientes",
    items: [
      { href: "/clientes", label: "Órdenes de compra", icon: Ship },
      { href: "/clientes/lista", label: "Clientes", icon: Users },
      { href: "/ferrada", label: "Ferrada", icon: Handshake },
    ],
  },
  {
    grupo: "Control",
    items: [
      { href: "/alertas", label: "Alertas", icon: Bell },
      { href: "/configuracion", label: "Configuración", icon: Settings },
    ],
  },
];

const HREFS = NAV.flatMap((g) => g.items.map((i) => i.href));
function activo(path: string, href: string) {
  if (href === "/") return path === "/";
  const coincide = (h: string) => path === h || path.startsWith(h + "/");
  if (!coincide(href)) return false;
  // gana la ruta más específica (ej. /productores/pagos sobre /productores)
  return !HREFS.some((h) => h !== href && h.length > href.length && coincide(h));
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-5">
      {NAV.map((g) => (
        <div key={g.grupo}>
          <div className="px-3 pb-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-leaf-100/50">{g.grupo}</div>
          <ul className="flex flex-col gap-0.5">
            {g.items.map((it) => {
              const active = activo(path, it.href);
              const Icon = it.icon;
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={onNavigate}
                    className={clsx(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] transition",
                      active ? "text-white" : "text-leaf-100/80 hover:bg-white/5 hover:text-white",
                    )}
                    style={active ? { backgroundColor: "rgba(255,255,255,.12)" } : undefined}
                  >
                    <Icon size={17} strokeWidth={1.8} aria-hidden />
                    <span className="flex-1">{it.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-3">
      <div className="rounded-md bg-white p-1">
        <Image src="/logo-cfs.png" alt="CFS" width={44} height={38} priority />
      </div>
      <div className="leading-tight">
        <div className="font-display text-[15px] font-bold text-white">Central Frutícola Sur</div>
        <div className="font-mono text-[11px] text-leaf-100/60">Sistema de gestión</div>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Sidebar escritorio */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-7 overflow-y-auto bg-leaf-900 py-5 lg:flex">
        <Brand />
        <div className="px-2">
          <NavLinks />
        </div>
        <div className="mt-auto px-5 text-[12px] text-leaf-100/50">Datos de ejemplo para revisión</div>
      </aside>

      {/* Drawer móvil */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Cerrar menú" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col gap-6 overflow-y-auto bg-leaf-900 py-5">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button aria-label="Cerrar menú" onClick={() => setOpen(false)} className="text-white/80">
                <X size={20} />
              </button>
            </div>
            <div className="px-2">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {/* Barra superior */}
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
          <button aria-label="Abrir menú" className="text-ink-700 lg:hidden" onClick={() => setOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <Image src="/logo-cfs.png" alt="CFS" width={32} height={27} />
          </div>
          <div className="hidden items-center gap-2 rounded-lg border border-ink-200 px-2.5 py-1 text-sm sm:flex">
            <Boxes size={15} className="text-leaf-500" aria-hidden />
            <span className="text-ink-500">Temporada</span>
            <span className="font-semibold">{TEMPORADA_ACTUAL}</span>
          </div>
          <div className="hidden rounded-md bg-amber-50 px-2 py-1 text-[12px] text-amber-800 md:block">
            Maqueta · datos de ejemplo al {fechaLarga(HOY)}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/alertas" className="relative text-ink-600 hover:text-ink-900" aria-label="Alertas">
              <Bell size={19} />
              <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-white" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-leaf-50 font-display text-sm font-bold text-leaf-700">FP</div>
              <div className="hidden leading-tight sm:block">
                <div className="text-sm font-medium">Francisco Padilla</div>
                <div className="text-[11.5px] text-ink-500">Gerencia</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 sm:px-6">{children}</main>
    </div>
  );
}

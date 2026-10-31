"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { signOut } from "next-auth/react";
import { Factory, Handshake, LayoutDashboard, LogOut, Menu, Settings, Ship, Sprout, Truck, X } from "lucide-react";

const NAV = [
  { grupo: "General", items: [{ href: "/", label: "Inicio", icon: LayoutDashboard }] },
  {
    grupo: "Ferrada",
    items: [
      { href: "/ferrada", label: "Operaciones", icon: Handshake },
      { href: "/proveedores", label: "Proveedores", icon: Truck },
    ],
  },
  { grupo: "Control", items: [{ href: "/configuracion", label: "Configuración", icon: Settings }] },
];

const PRONTO = [
  { label: "Productores", icon: Sprout },
  { label: "Proceso y embalaje", icon: Factory },
  { label: "Clientes directos", icon: Ship },
];

const HREFS = NAV.flatMap((g) => g.items.map((i) => i.href));
function activo(path: string, href: string) {
  if (href === "/") return path === "/";
  const coincide = (h: string) => path === h || path.startsWith(h + "/");
  if (!coincide(href)) return false;
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
                    className={clsx("flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] transition", active ? "text-white" : "text-leaf-100/80 hover:bg-white/5 hover:text-white")}
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
      <div>
        <div className="px-3 pb-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-leaf-100/50">Próximamente</div>
        <ul className="flex flex-col gap-0.5">
          {PRONTO.map((it) => (
            <li key={it.label} className="flex items-center gap-2.5 px-3 py-2 text-[14px] text-leaf-100/35">
              <it.icon size={17} strokeWidth={1.8} aria-hidden />
              {it.label}
            </li>
          ))}
        </ul>
      </div>
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

const ROL = { admin: "Administrador", operaciones: "Operaciones", lectura: "Solo lectura" } as const;

export function Shell({ children, usuario }: { children: React.ReactNode; usuario: { nombre: string; email: string; rol: keyof typeof ROL } }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  const iniciales = usuario.nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-7 overflow-y-auto bg-leaf-900 py-5 lg:flex">
        <Brand />
        <div className="px-2">
          <NavLinks />
        </div>
      </aside>

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

      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
          <button aria-label="Abrir menú" className="text-ink-700 lg:hidden" onClick={() => setOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <Image src="/logo-cfs.png" alt="CFS" width={32} height={27} />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-leaf-50 font-display text-sm font-bold text-leaf-700">{iniciales || "?"}</div>
              <div className="hidden leading-tight sm:block">
                <div className="text-sm font-medium">{usuario.nombre}</div>
                <div className="text-[11.5px] text-ink-500">{ROL[usuario.rol]}</div>
              </div>
            </div>
            <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="btn-ghost px-2 py-1" title="Cerrar sesión">
              <LogOut size={15} /> <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 sm:px-6">{children}</main>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { signOut } from "next-auth/react";
import { Factory, Handshake, LayoutDashboard, LogOut, Settings, Ship, Sprout, Truck } from "lucide-react";

const NAV = [
  { grupo: "General", items: [{ href: "/", label: "Inicio", corto: "Inicio", icon: LayoutDashboard }] },
  {
    grupo: "Ferrada",
    items: [
      { href: "/ferrada", label: "Operaciones", corto: "Operaciones", icon: Handshake },
      { href: "/proveedores", label: "Proveedores", corto: "Proveedores", icon: Truck },
    ],
  },
  { grupo: "Control", items: [{ href: "/configuracion", label: "Configuración", corto: "Ajustes", icon: Settings }] },
];

const PRONTO = [
  { label: "Productores", icon: Sprout },
  { label: "Proceso y embalaje", icon: Factory },
  { label: "Clientes directos", icon: Ship },
];

const ITEMS = NAV.flatMap((g) => g.items);
const HREFS = ITEMS.map((i) => i.href);
function activo(path: string, href: string) {
  if (href === "/") return path === "/";
  const coincide = (h: string) => path === h || path.startsWith(h + "/");
  if (!coincide(href)) return false;
  return !HREFS.some((h) => h !== href && h.length > href.length && coincide(h));
}

function Sidebar() {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-5">
      {NAV.map((g) => (
        <div key={g.grupo}>
          <div className="px-3 pb-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-leaf-100/50">{g.grupo}</div>
          <ul className="flex flex-col gap-0.5">
            {g.items.map((it) => {
              const act = activo(path, it.href);
              const Icon = it.icon;
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    aria-current={act ? "page" : undefined}
                    className={clsx("flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] transition", act ? "text-white" : "text-leaf-100/80 hover:bg-white/5 hover:text-white")}
                    style={act ? { backgroundColor: "rgba(255,255,255,.12)" } : undefined}
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

/** Barra de pestañas inferior para teléfono y tablet: lo principal siempre a un toque del pulgar. */
function BarraInferior() {
  const path = usePathname();
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid h-16 max-w-xl grid-cols-4">
        {ITEMS.map((it) => {
          const act = activo(path, it.href);
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={act ? "page" : undefined}
                className={clsx("flex h-full flex-col items-center justify-center gap-1 text-[11.5px] font-medium", act ? "text-leaf-700" : "text-ink-500")}
              >
                <span className={clsx("flex h-7 w-14 items-center justify-center rounded-full transition", act && "bg-leaf-50")}>
                  <Icon size={21} strokeWidth={act ? 2.2 : 1.8} aria-hidden />
                </span>
                {it.corto}
              </Link>
            </li>
          );
        })}
      </ul>
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
          <Sidebar />
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/90 backdrop-blur" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="flex items-center gap-3 px-4 py-2 sm:px-6">
          <Link href="/" className="flex items-center gap-2 lg:hidden" aria-label="Inicio">
            <Image src="/logo-cfs.png" alt="" width={34} height={29} />
            <span className="font-display text-[15px] font-bold text-ink-900">Sistema CFS</span>
          </Link>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2" title={usuario.email}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-leaf-50 font-display text-sm font-bold text-leaf-700">{iniciales || "?"}</div>
              <div className="hidden leading-tight sm:block">
                <div className="text-sm font-medium">{usuario.nombre}</div>
                <div className="text-[11.5px] text-ink-500">{ROL[usuario.rol]}</div>
              </div>
            </div>
            <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="btn-ghost px-2.5" title="Cerrar sesión" aria-label="Cerrar sesión">
              <LogOut size={16} /> <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="pb-nav mx-auto max-w-[1400px] px-4 pt-5 sm:px-6 sm:pt-6 lg:pb-16">{children}</main>
      <BarraInferior />
    </div>
  );
}

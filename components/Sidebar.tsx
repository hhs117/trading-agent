"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, X } from "lucide-react";

import { NAV_GROUPS, isNavActive } from "./nav.config";
import { useNavShell } from "./NavShell";

function NavBody() {
  const pathname = usePathname();

  return (
    <nav className="space-y-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <div className="mb-1.5 px-3 text-[10.5px] font-medium uppercase tracking-[0.08em] text-apple-gray-300">
            {group.title}
          </div>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item, pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] transition-colors",
                      active
                        ? "bg-apple-blue/10 font-medium text-apple-blue"
                        : "text-apple-gray-300 hover:bg-apple-gray-50 hover:text-apple-gray-900",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
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

function SidebarHeader({ onClose }: { onClose?: () => void }) {
  return (
    <div className="mb-6 flex items-center justify-between px-3">
      <Link href="/" className="group flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-apple-blue transition-transform group-hover:scale-105">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="text-[15px] font-semibold leading-none text-apple-gray-900">SEAPick</div>
          <div className="mt-1 text-[11px] text-apple-gray-300">跨境选品运营平台</div>
        </div>
      </Link>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="关闭导航"
          className="rounded-lg p-1.5 text-apple-gray-300 hover:bg-apple-gray-50 lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-6 rounded-2xl bg-gradient-to-br from-apple-blue to-blue-500 p-4 text-white">
      <div className="mb-1 text-[12.5px] font-medium">MVP 演示版</div>
      <div className="text-[11px] leading-relaxed text-white/85">
        所有数据存储在浏览器本地，清空缓存或更换设备会丢失。
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { mobileOpen, closeMobile } = useNavShell();

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-apple-gray-100 bg-white/70 backdrop-blur-xl lg:flex">
        <div className="flex w-full flex-col px-4 py-6">
          <SidebarHeader />
          <div className="flex-1">
            <NavBody />
          </div>
          <Footer />
        </div>
      </aside>

      <div
        className={[
          "fixed inset-0 z-40 transition-opacity lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        aria-hidden={!mobileOpen}
      >
        <div className="absolute inset-0 bg-apple-gray-900/30 backdrop-blur-sm" onClick={closeMobile} />
        <aside
          className={[
            "absolute bottom-0 left-0 top-0 w-72 max-w-[85%] overflow-y-auto bg-white shadow-hover",
            "transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex min-h-full flex-col px-4 py-6">
            <SidebarHeader onClose={closeMobile} />
            <div className="flex-1">
              <NavBody />
            </div>
            <Footer />
          </div>
        </aside>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Plus, Settings, Sparkles } from "lucide-react";

const NAV = [
  { href: "/", label: "数据看板", icon: LayoutDashboard },
  { href: "/products", label: "产品库", icon: Package },
  { href: "/products/new", label: "新建产品", icon: Plus },
  { href: "/settings", label: "设置", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-apple-gray-100 bg-white/70 backdrop-blur-xl px-4 py-6 sticky top-0 h-screen">
      <div className="flex items-center gap-2 px-3 mb-8">
        <div className="w-8 h-8 rounded-xl bg-apple-blue flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-[15px] font-semibold text-apple-gray-900">SEAPick</div>
          <div className="text-[11px] text-apple-gray-300 -mt-0.5">东南亚选品助手</div>
        </div>
      </div>

      <nav className="space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] transition-colors",
                active
                  ? "bg-apple-gray-50 text-apple-gray-900 font-medium"
                  : "text-apple-gray-300 hover:text-apple-gray-900 hover:bg-apple-gray-50/60",
              ].join(" ")}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-6 left-4 right-4">
        <div className="rounded-2xl bg-gradient-to-br from-apple-blue to-blue-500 text-white p-4">
          <div className="text-[13px] font-medium mb-1">MVP 演示版</div>
          <div className="text-[11px] text-white/80 leading-relaxed">
            数据存储在浏览器本地，清空缓存会丢失。
          </div>
        </div>
      </div>
    </aside>
  );
}

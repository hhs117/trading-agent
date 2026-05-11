"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

const TITLE_MAP: Record<string, string> = {
  "/": "数据看板",
  "/products": "产品库",
  "/products/new": "新建产品",
  "/settings": "设置",
};

function resolveTitle(pathname: string): string {
  if (TITLE_MAP[pathname]) return TITLE_MAP[pathname];
  if (pathname.startsWith("/products/") && pathname.split("/").length >= 3) {
    return "产品详情";
  }
  return "SEAPick";
}

export default function TopBar() {
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  return (
    <header className="sticky top-0 z-10 border-b border-apple-gray-100 bg-white/70 backdrop-blur-xl">
      <div className="px-8 py-4 flex items-center justify-between max-w-[1400px] mx-auto">
        <h1 className="text-[20px] font-semibold text-apple-gray-900">{title}</h1>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-apple-gray-300" />
          <input
            placeholder="搜索产品…"
            className="bg-apple-gray-50 rounded-xl py-2 pl-9 pr-4 text-[13px] w-72 outline-none focus:ring-2 focus:ring-apple-blue/30 transition"
          />
        </div>
      </div>
    </header>
  );
}

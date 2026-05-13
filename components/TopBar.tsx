"use client";

import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";

import { resolveNavTitle } from "./nav.config";
import { useNavShell } from "./NavShell";

export default function TopBar() {
  const pathname = usePathname();
  const title = resolveNavTitle(pathname);
  const { openMobile } = useNavShell();

  return (
    <header className="sticky top-0 z-20 border-b border-apple-gray-100 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={openMobile}
            aria-label="打开导航"
            className="-ml-1 rounded-lg p-2 text-apple-gray-900 hover:bg-apple-gray-50 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="truncate text-[17px] font-semibold text-apple-gray-900 sm:text-[20px]">
            {title}
          </h1>
        </div>

        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-apple-gray-300" />
          <input
            placeholder="搜索产品、文案、关键词..."
            className="w-56 rounded-xl bg-apple-gray-50 py-2 pl-9 pr-4 text-[13px] outline-none transition focus:ring-2 focus:ring-apple-blue/30 md:w-72"
          />
        </div>
      </div>
    </header>
  );
}

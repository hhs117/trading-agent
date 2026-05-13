import type { Metadata } from "next";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { NavShellProvider } from "@/components/NavShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEAPick · 跨境电商选品与运营平台",
  description: "面向跨境电商卖家的选品分析、内容生成、运营辅助与财务工具平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <NavShellProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <TopBar />
              <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                {children}
              </main>
            </div>
          </div>
        </NavShellProvider>
      </body>
    </html>
  );
}

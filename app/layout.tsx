import type { Metadata } from "next";

import AppChrome from "@/components/AppChrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEAPick · 跨境电商选品与运营平台",
  description: "面向跨境电商卖家的选品分析、内容生成、运营辅助与财务工具平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}

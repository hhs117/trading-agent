import {
  BarChart3,
  Calculator,
  FileText,
  Grid3x3,
  ImageOff,
  Languages,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  Package,
  Plus,
  Rocket,
  Search,
  Settings,
  Store,
  ShieldCheck,
  Swords,
  TrendingUp,
  Truck,
  Upload,
  Wand2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefix?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "概览",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "产品管理",
    items: [
      { href: "/products", label: "产品列表", icon: Package, matchPrefix: "/products" },
      { href: "/products/new", label: "新增产品", icon: Plus },
      { href: "/products/detail", label: "产品详情", icon: FileText },
    ],
  },
  {
    title: "选品分析",
    items: [
      { href: "/scoring", label: "九宫格评分", icon: Grid3x3 },
      { href: "/analytics", label: "平台数据分析", icon: BarChart3 },
      { href: "/search-products", label: "全网查品", icon: Search },
      { href: "/competitors", label: "竞品对比", icon: Swords },
    ],
  },
  {
    title: "内容生成",
    items: [
      { href: "/copywriting", label: "多语言文案生成", icon: Languages },
      { href: "/ai-prompts", label: "AI 图片 / 视频建议", icon: Wand2 },
      { href: "/image-review", label: "美工图片纠错", icon: ImageOff },
    ],
  },
  {
    title: "运营辅助",
    items: [
      { href: "/optimization", label: "产品优化建议", icon: Lightbulb },
      { href: "/listing", label: "上品辅助", icon: Upload },
      { href: "/publish-center", label: "发布中台", icon: Rocket },
      { href: "/chatbot", label: "客服机器人", icon: MessageSquare },
      { href: "/logistics", label: "物流跟进", icon: Truck },
    ],
  },
  {
    title: "财务工具",
    items: [
      { href: "/finance", label: "财务利润计算", icon: Calculator },
      { href: "/finance-stats", label: "财务统计", icon: TrendingUp },
    ],
  },
  {
    title: "安全中心",
    items: [{ href: "/security", label: "安全中心", icon: ShieldCheck, matchPrefix: "/security" }],
  },
  {
    title: "系统",
    items: [
      { href: "/stores", label: "店铺管理", icon: Store },
      { href: "/shopee", label: "Shopee 接入", icon: Store, matchPrefix: "/shopee" },
      { href: "/tiktok-shop", label: "TikTok Shop 接入", icon: Store, matchPrefix: "/tiktok-shop" },
      { href: "/settings", label: "设置", icon: Settings },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export function resolveNavTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/products/") && pathname !== "/products/new" && pathname !== "/products/detail") {
    return "产品详情";
  }
  const exact = ALL_NAV_ITEMS.find((item) => item.href === pathname);
  if (exact) return exact.label;
  const prefix = ALL_NAV_ITEMS.find((item) => item.matchPrefix && pathname.startsWith(item.matchPrefix));
  return prefix?.label ?? "SEAPick";
}

export function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/") return pathname === "/";
  const exactOnly = ["/products/new", "/products/detail"];
  if (exactOnly.includes(item.href)) return pathname === item.href;
  if (pathname === item.href) return true;
  if (item.matchPrefix && pathname.startsWith(item.matchPrefix + "/")) {
    if (exactOnly.some((path) => pathname === path)) return false;
    return true;
  }
  return false;
}

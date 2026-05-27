/**
 * Activity feed — drives the Dashboard "最近操作" section.
 *
 * Backed by localStorage. New entries are pushed by user actions
 * (creating a product, completing a score, generating copy, etc.).
 * On first read we seed a believable history so the empty state
 * doesn't dominate the dashboard.
 */

import { getStorageData, setStorageData } from "@/lib/storage";

export type ActivityType =
  | "product_created"
  | "product_updated"
  | "product_deleted"
  | "scoring_completed"
  | "copywriting_generated"
  | "image_reviewed"
  | "finance_calculated";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  productId?: string;
  productName?: string;
  detail?: string;
  timestamp: string; // ISO
}

const STORAGE_KEY = "seapick:activityLog";
const MAX_ENTRIES = 50;

/** Seeded activity baseline so the dashboard renders meaningful history out of the box. */
const SEED_ACTIVITY: ActivityEntry[] = [
  {
    id: "act-seed-1",
    type: "scoring_completed",
    productId: "sp-1003",
    productName: "记忆棉折叠人体工学颈枕（U型）",
    detail: "综合评分 7.8 · 推荐上架",
    timestamp: "2026-05-12T13:42:00.000Z",
  },
  {
    id: "act-seed-2",
    type: "copywriting_generated",
    productId: "sp-1004",
    productName: "高弹力高腰瑜伽裤 蜜桃臀塑形款",
    detail: "生成 5 种语言文案（en / th / vi / id / ms）",
    timestamp: "2026-05-12T09:18:00.000Z",
  },
  {
    id: "act-seed-3",
    type: "finance_calculated",
    productId: "sp-1012",
    productName: "智能数控空气炸锅 4L 大容量低脂",
    detail: "测算毛利率 23.4%，盈亏平衡售价 $69.20",
    timestamp: "2026-05-11T16:05:00.000Z",
  },
  {
    id: "act-seed-4",
    type: "product_created",
    productId: "sp-1015",
    productName: "学生党 LED 高颜值折叠化妆镜",
    detail: "新建产品并设为「测试中」",
    timestamp: "2026-05-11T08:30:00.000Z",
  },
  {
    id: "act-seed-5",
    type: "image_reviewed",
    productId: "sp-1011",
    productName: "真丝降噪睡眠眼罩",
    detail: "审查 3 张主图，建议替换 1 张含中文水印的图",
    timestamp: "2026-05-10T14:22:00.000Z",
  },
  {
    id: "act-seed-6",
    type: "scoring_completed",
    productId: "sp-1001",
    productName: "304不锈钢真空保温杯 500ml",
    detail: "综合评分 7.6 · 推荐上架",
    timestamp: "2026-05-09T11:05:00.000Z",
  },
  {
    id: "act-seed-7",
    type: "finance_calculated",
    productId: "sp-1006",
    productName: "多功能不锈钢削皮刀+磨刀器套装（4 件）",
    detail: "Temu 客单价过低，建议跑差异化包装",
    timestamp: "2026-05-08T10:48:00.000Z",
  },
  {
    id: "act-seed-8",
    type: "copywriting_generated",
    productId: "sp-1011",
    productName: "真丝降噪睡眠眼罩",
    detail: "生成英语 / 泰语文案",
    timestamp: "2026-05-07T07:30:00.000Z",
  },
];

export function getActivityLog(): ActivityEntry[] {
  const data = getStorageData<ActivityEntry[] | null>(STORAGE_KEY, null) ?? [];
  const cleaned = data.filter((entry) => !entry.id.startsWith("act-seed-"));
  if (cleaned.length !== data.length) {
    setStorageData(STORAGE_KEY, cleaned);
  }
  return cleaned;
}

export function logActivity(entry: Omit<ActivityEntry, "id" | "timestamp">): void {
  const log = getActivityLog();
  const next: ActivityEntry = {
    ...entry,
    id: `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  const trimmed = [next, ...log].slice(0, MAX_ENTRIES);
  setStorageData(STORAGE_KEY, trimmed);
}

export function clearActivityLog(): void {
  setStorageData(STORAGE_KEY, []);
}

/** Map activity type → human label + tone for the timeline UI. */
export const ACTIVITY_META: Record<
  ActivityType,
  { label: string; tone: "blue" | "green" | "orange" | "red" | "purple" | "gray" }
> = {
  product_created: { label: "新增产品", tone: "blue" },
  product_updated: { label: "更新产品", tone: "gray" },
  product_deleted: { label: "删除产品", tone: "red" },
  scoring_completed: { label: "完成评分", tone: "green" },
  copywriting_generated: { label: "生成文案", tone: "purple" },
  image_reviewed: { label: "图片审查", tone: "orange" },
  finance_calculated: { label: "利润测算", tone: "blue" },
};

/** Tiny relative time formatter — "5 分钟前 / 2 小时前 / 3 天前". */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const diff = Math.max(0, now - t);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "刚刚";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} 天前`;
  const mon = Math.floor(day / 30);
  if (mon < 12) return `${mon} 个月前`;
  return `${Math.floor(mon / 12)} 年前`;
}

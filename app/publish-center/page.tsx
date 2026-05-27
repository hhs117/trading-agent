"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Rocket, Store, XCircle } from "lucide-react";

import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { createListingPublishJob, fetchListingPublishJobs } from "@/lib/api/listingPublishJobs";
import { fetchApiStores } from "@/lib/api/stores";
import type { ListingPublishJobRecord, StoreRecord } from "@/lib/server/database";

type PlatformStatus = {
  configured: boolean;
  missing?: string[];
  authUrlReady?: boolean;
};

type StatusState = {
  shopee?: PlatformStatus;
  tiktokShop?: PlatformStatus;
};

const SAMPLE_DRAFT = {
  title: "授权审核期测试草稿",
  sku: "READY-CHECK-001",
  price: 19.9,
  currency: "USD",
  stock: 10,
  images: [],
  description: "用于验证发布任务链路，不会真实上架。",
};

export default function PublishCenterPage() {
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [jobs, setJobs] = useState<ListingPublishJobRecord[]>([]);
  const [status, setStatus] = useState<StatusState>({});
  const [message, setMessage] = useState("");
  const activeStores = useMemo(() => stores.filter((store) => store.isActive), [stores]);

  useEffect(() => {
    void reload();
  }, []);

  async function reload() {
    const [nextStores, nextJobs, shopeeStatus, tiktokStatus] = await Promise.all([
      fetchApiStores(),
      fetchListingPublishJobs({ limit: 30 }),
      fetchPlatformStatus("/api/shopee/status", "shopee"),
      fetchPlatformStatus("/api/tiktok-shop/status", "tiktokShop"),
    ]);
    setStores(nextStores ?? []);
    setJobs(nextJobs ?? []);
    setStatus({ shopee: shopeeStatus, tiktokShop: tiktokStatus });
  }

  async function createReadyCheckJob(platform: string) {
    setMessage("");
    const store = activeStores.find((item) => item.platform.toLowerCase().includes(platform.toLowerCase()));
    const job = await createListingPublishJob({
      storeId: store?.id ?? null,
      platform,
      status: "dry_run",
      draft: SAMPLE_DRAFT,
      validationIssues: [
        {
          severity: "warning",
          field: "images",
          message: "正式上架前需要补齐平台合规主图。",
        },
      ],
    });
    if (!job) {
      setMessage("创建发布演练任务失败，请确认数据库和登录权限。");
      return;
    }
    setMessage("发布演练任务已保存。");
    await reload();
  }

  const checklist = [
    {
      label: "店铺档案",
      done: stores.length > 0,
      detail: stores.length ? `${stores.length} 个店铺已建档` : "先在店铺管理里创建 Shopee / TikTok Shop 店铺",
    },
    {
      label: "启用店铺",
      done: activeStores.length > 0,
      detail: activeStores.length ? `${activeStores.length} 个店铺处于启用状态` : "至少启用一个店铺，发布任务才有归属",
    },
    {
      label: "平台环境变量",
      done: Boolean(status.shopee?.configured || status.tiktokShop?.configured),
      detail: platformEnvDetail(status),
    },
    {
      label: "授权回调",
      done: Boolean(status.shopee?.authUrlReady || status.tiktokShop?.authUrlReady),
      detail: "审核通过后用同一套回调保存 token、刷新 token、标记失效",
    },
    {
      label: "发布任务记录",
      done: jobs.length > 0,
      detail: jobs.length ? `${jobs.length} 条草稿 / 演练 / 发布记录` : "可以先创建演练任务，验证链路和权限",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Rocket}
        title="发布中台"
        description="把授权审核前能准备的底座集中到这里：店铺、授权状态、发布任务、草稿校验和上线前缺口。"
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="上线前清单"
          description="这些项补齐后，平台授权一通过就能进入真实发布接口联调。"
          action={
            <Button type="button" icon={ClipboardCheck} variant="secondary" onClick={() => void reload()}>
              刷新
            </Button>
          }
        >
          <div className="space-y-3">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-xl border border-apple-gray-100 bg-apple-gray-50 p-3">
                {item.done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-apple-green" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-apple-orange" />
                )}
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-apple-gray-900">{item.label}</div>
                  <div className="mt-1 text-[12px] leading-relaxed text-apple-gray-300">{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="平台授权状态" description="这里不是网页登录状态，而是平台开放 API 的 App 凭证和 OAuth 配置状态。">
          <div className="grid gap-3">
            <PlatformStatusCard name="Shopee" status={status.shopee} onCreate={() => void createReadyCheckJob("Shopee")} />
            <PlatformStatusCard
              name="TikTok Shop"
              status={status.tiktokShop}
              onCreate={() => void createReadyCheckJob("TikTok Shop")}
            />
          </div>
          {message && <div className="mt-4 text-[12px] text-apple-gray-300">{message}</div>}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="店铺归属" description="发布任务会绑定到店铺，后续订单、库存、利润和错误回溯都按店铺聚合。">
          {stores.length ? (
            <div className="space-y-3">
              {stores.map((store) => (
                <div key={store.id} className="rounded-xl border border-apple-gray-100 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Store className="h-4 w-4 shrink-0 text-apple-gray-300" />
                      <div className="truncate text-[13px] font-semibold text-apple-gray-900">{store.name}</div>
                    </div>
                    <Badge tone={store.connectionStatus === "connected" ? "green" : "gray"} size="sm">
                      {connectionLabel(store.connectionStatus)}
                    </Badge>
                  </div>
                  <div className="mt-2 text-[12px] text-apple-gray-300">
                    {store.platform} · {store.market} · {store.currency} · {store.isActive ? "启用" : "停用"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="还没有店铺档案。" />
          )}
        </SectionCard>

        <SectionCard title="最近发布任务" description="草稿、校验、演练发布和真实发布都会写到这里，方便失败重试。">
          {jobs.length ? (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="rounded-xl border border-apple-gray-100 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-[13px] font-semibold text-apple-gray-900">{draftTitle(job.draft)}</div>
                      <div className="mt-1 text-[12px] text-apple-gray-300">
                        {job.platform} · {new Date(job.updatedAt).toLocaleString("zh-CN")}
                      </div>
                    </div>
                    <Badge tone={statusTone(job.status)} size="sm">
                      {statusLabel(job.status)}
                    </Badge>
                  </div>
                  <div className="mt-2 text-[12px] text-apple-gray-300">
                    校验问题：{job.validationIssues.length} · 外部商品 ID：{job.externalProductId || "未生成"}
                  </div>
                  {job.errorMessage && <div className="mt-2 text-[12px] text-apple-red">{job.errorMessage}</div>}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="还没有发布任务。可以先创建 Shopee 或 TikTok Shop 演练任务。" />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

async function fetchPlatformStatus(url: string, key: "shopee" | "tiktokShop"): Promise<PlatformStatus | undefined> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return undefined;
    const body = (await response.json()) as Record<string, unknown>;
    return body[key] as PlatformStatus | undefined;
  } catch {
    return undefined;
  }
}

function PlatformStatusCard({
  name,
  status,
  onCreate,
}: {
  name: string;
  status?: PlatformStatus;
  onCreate: () => void;
}) {
  const configured = Boolean(status?.configured);
  return (
    <div className="rounded-xl border border-apple-gray-100 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {configured ? (
              <CheckCircle2 className="h-4 w-4 text-apple-green" />
            ) : (
              <XCircle className="h-4 w-4 text-apple-orange" />
            )}
            <div className="text-[14px] font-semibold text-apple-gray-900">{name}</div>
          </div>
          <div className="mt-2 text-[12px] leading-relaxed text-apple-gray-300">
            {configured ? "App 基础参数已配置，等平台审核通过后接 token 交换。" : `缺少：${status?.missing?.join("、") || "平台 App 参数"}`}
          </div>
        </div>
        <Button type="button" icon={Rocket} variant="secondary" onClick={onCreate}>
          演练
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid min-h-[160px] place-items-center rounded-xl border border-dashed border-apple-gray-200 bg-apple-gray-50 text-center">
      <div className="px-4 text-[13px] text-apple-gray-300">{text}</div>
    </div>
  );
}

function platformEnvDetail(status: StatusState) {
  const ready = [status.shopee?.configured ? "Shopee" : "", status.tiktokShop?.configured ? "TikTok Shop" : ""].filter(Boolean);
  return ready.length ? `${ready.join("、")} 基础环境变量已配置` : "先填平台 App Key / Secret / Redirect URL";
}

function connectionLabel(value: StoreRecord["connectionStatus"]) {
  return {
    unconfigured: "未配置",
    connected: "已连接",
    needs_reauth: "需重新授权",
    error: "异常",
  }[value];
}

function statusLabel(value: ListingPublishJobRecord["status"]) {
  return {
    draft: "草稿",
    validated: "已校验",
    dry_run: "演练",
    publishing: "发布中",
    published: "已发布",
    failed: "失败",
  }[value];
}

function statusTone(value: ListingPublishJobRecord["status"]): "gray" | "green" | "orange" | "red" | "blue" {
  if (value === "published") return "green";
  if (value === "failed") return "red";
  if (value === "publishing") return "blue";
  if (value === "dry_run" || value === "validated") return "orange";
  return "gray";
}

function draftTitle(draft: Record<string, unknown>) {
  return typeof draft.title === "string" && draft.title.trim() ? draft.title : "未命名发布草稿";
}

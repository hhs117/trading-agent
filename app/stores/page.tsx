"use client";

import { useEffect, useState } from "react";
import { Building2, CheckCircle2, PlugZap, Store, XCircle } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createApiStore, fetchApiStores, updateApiStore } from "@/lib/api/stores";
import type { StoreRecord } from "@/lib/server/database";

const PLATFORMS = ["Shopee", "Lazada", "TikTok Shop", "Amazon", "Temu", "AliExpress"];
const SOURCE_TYPES: Array<StoreRecord["sourceType"]> = ["manual", "api", "csv"];
const CONNECTION_STATUSES: Array<StoreRecord["connectionStatus"]> = [
  "unconfigured",
  "connected",
  "needs_reauth",
  "error",
];

type FormState = {
  name: string;
  platform: string;
  market: string;
  sellerId: string;
  currency: string;
  timezone: string;
  sourceType: StoreRecord["sourceType"];
  connectionStatus: StoreRecord["connectionStatus"];
  notes: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  platform: "Shopee",
  market: "泰国",
  sellerId: "",
  currency: "THB",
  timezone: "Asia/Bangkok",
  sourceType: "manual",
  connectionStatus: "unconfigured",
  notes: "",
};

export default function StoresPage() {
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void reload();
  }, []);

  async function reload() {
    const remoteStores = await fetchApiStores();
    setStores(remoteStores ?? []);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const created = await createApiStore(form);
    if (!created) {
      setMessage("创建失败，请检查字段后再试。");
      return;
    }
    setForm(INITIAL_FORM);
    setMessage("店铺已创建");
    await reload();
  }

  async function toggleActive(store: StoreRecord) {
    const action = store.isActive ? "停用" : "启用";
    if (!confirm(`确认${action}店铺「${store.name}」？`)) return;
    const updated = await updateApiStore(store.id, { isActive: !store.isActive });
    if (!updated) {
      setMessage(`${action}失败`);
      return;
    }
    setMessage(`店铺已${action}`);
    await reload();
  }

  async function changeConnectionStatus(store: StoreRecord, connectionStatus: StoreRecord["connectionStatus"]) {
    if (store.connectionStatus === connectionStatus) return;
    const updated = await updateApiStore(store.id, { connectionStatus });
    if (!updated) {
      setMessage("连接状态更新失败");
      return;
    }
    setMessage("连接状态已更新");
    await reload();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Store}
        title="店铺管理"
        description="维护真实数据接入所需的店铺维度。后续订单、商品、利润和物流都会挂到具体店铺下。"
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_1fr]">
        <SectionCard title="新增店铺" description="这里先保存店铺元数据；真实授权凭证后续通过平台 OAuth 或密钥接入。">
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="店铺名称">
              <input value={form.name} onChange={(event) => update("name", event.target.value)} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="平台">
                <select value={form.platform} onChange={(event) => update("platform", event.target.value)} className={inputCls}>
                  {PLATFORMS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="市场">
                <input value={form.market} onChange={(event) => update("market", event.target.value)} className={inputCls} />
              </Field>
            </div>
            <Field label="卖家 ID">
              <input value={form.sellerId} onChange={(event) => update("sellerId", event.target.value)} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="币种">
                <input value={form.currency} onChange={(event) => update("currency", event.target.value)} className={inputCls} />
              </Field>
              <Field label="时区">
                <input value={form.timezone} onChange={(event) => update("timezone", event.target.value)} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="数据来源">
                <select value={form.sourceType} onChange={(event) => update("sourceType", event.target.value as StoreRecord["sourceType"])} className={inputCls}>
                  {SOURCE_TYPES.map((item) => (
                    <option key={item} value={item}>
                      {sourceTypeLabel(item)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="连接状态">
                <select
                  value={form.connectionStatus}
                  onChange={(event) => update("connectionStatus", event.target.value as StoreRecord["connectionStatus"])}
                  className={inputCls}
                >
                  {CONNECTION_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {connectionLabel(item)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="备注">
              <textarea
                value={form.notes}
                onChange={(event) => update("notes", event.target.value)}
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </Field>
            <Button type="submit" icon={Building2}>
              新增店铺
            </Button>
            {message && <div className="text-[12px] text-apple-gray-300">{message}</div>}
          </form>
        </SectionCard>

        <SectionCard title="已配置店铺" description="API 接入完成后，这里会成为后续同步任务和数据监控的主索引。">
          {stores.length ? (
            <div className="space-y-3">
              {stores.map((store) => (
                <div key={store.id} className="rounded-2xl border border-apple-gray-100 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[14px] font-semibold text-apple-gray-900">{store.name}</h3>
                        <Badge tone={store.isActive ? "green" : "gray"}>{store.isActive ? "启用" : "停用"}</Badge>
                        <Badge tone={connectionTone(store.connectionStatus)}>{connectionLabel(store.connectionStatus)}</Badge>
                      </div>
                      <div className="mt-1 text-[12px] text-apple-gray-300">
                        {store.platform} · {store.market} · {store.currency} · {store.timezone}
                      </div>
                      <div className="mt-1 text-[12px] text-apple-gray-300">
                        卖家 ID：{store.sellerId || "未填写"} · 数据来源：{sourceTypeLabel(store.sourceType)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void toggleActive(store)}
                      className="rounded-xl bg-apple-gray-50 px-3 py-2 text-[12px] text-apple-gray-900"
                    >
                      {store.isActive ? "停用" : "启用"}
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr] md:items-center">
                    <label className="text-[12px] text-apple-gray-300">连接状态</label>
                    <select
                      value={store.connectionStatus}
                      onChange={(event) =>
                        void changeConnectionStatus(store, event.target.value as StoreRecord["connectionStatus"])
                      }
                      className={inputCls}
                    >
                      {CONNECTION_STATUSES.map((item) => (
                        <option key={item} value={item}>
                          {connectionLabel(item)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid min-h-[280px] place-items-center rounded-2xl border border-dashed border-apple-gray-200 bg-apple-gray-50/50 text-center">
              <div>
                <PlugZap className="mx-auto mb-3 h-7 w-7 text-apple-gray-300" />
                <div className="text-[14px] font-medium text-apple-gray-900">还没有配置店铺</div>
                <div className="mt-1 text-[12px] text-apple-gray-300">先新增一个真实店铺，后续所有数据接入都从这里开始。</div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-apple-gray-300">{label}</span>
      {children}
    </label>
  );
}

function sourceTypeLabel(value: StoreRecord["sourceType"]) {
  return value === "api" ? "API" : value === "csv" ? "CSV" : "手工";
}

function connectionLabel(value: StoreRecord["connectionStatus"]) {
  return {
    unconfigured: "未配置",
    connected: "已连接",
    needs_reauth: "需重新授权",
    error: "异常",
  }[value];
}

function connectionTone(value: StoreRecord["connectionStatus"]): "gray" | "green" | "orange" | "red" {
  if (value === "connected") return "green";
  if (value === "needs_reauth") return "orange";
  if (value === "error") return "red";
  return "gray";
}

const inputCls =
  "w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue";

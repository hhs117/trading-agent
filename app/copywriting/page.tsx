"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, History, Languages, Save, Sparkles, Trash2 } from "lucide-react";

import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

const LANGUAGES = ["英语", "日语", "韩语", "泰语", "越南语", "印尼语", "西班牙语"];
const STYLES = ["简洁型", "强营销型", "高级品牌型", "本土化口语型", "TikTok 爆款型"];
const PLATFORMS = ["Amazon", "Shopee", "Lazada", "TikTok Shop", "独立站", "Temu"];
const MARKETS = ["美国", "日本", "韩国", "泰国", "越南", "印尼", "西班牙", "墨西哥"];
const STORAGE_KEY = "seapick_content_copywriting_history";

type CopywritingInput = {
  title: string;
  sellingPoints: string;
  description: string;
  platform: string;
  market: string;
  language: string;
  style: string;
};

type CopywritingResult = {
  productTitle: string;
  bulletPoints: string[];
  detailDescription: string;
  seoKeywords: string[];
  platformTags: string[];
};

type HistoryRecord = {
  id: string;
  createdAt: string;
  input: CopywritingInput;
  result: CopywritingResult;
};

const initialInput: CopywritingInput = {
  title: "便携式折叠收纳包",
  sellingPoints: "大容量、防水面料、可折叠、旅行收纳、轻便耐用",
  description: "适合短途旅行、健身和日常通勤，可以放衣物、洗漱用品和电子配件。",
  platform: "TikTok Shop",
  market: "美国",
  language: "英语",
  style: "TikTok 爆款型",
};

function joinResult(result: CopywritingResult) {
  return [
    `商品标题：${result.productTitle}`,
    "",
    "五点卖点：",
    ...result.bulletPoints.map((item, index) => `${index + 1}. ${item}`),
    "",
    `详情页描述：${result.detailDescription}`,
    "",
    `SEO 关键词：${result.seoKeywords.join(", ")}`,
    `平台标签：${result.platformTags.join(", ")}`,
  ].join("\n");
}

function mockGenerateCopywriting(input: CopywritingInput): CopywritingResult {
  const title = input.title.trim() || "跨境热卖商品";
  const points = input.sellingPoints
    .split(/[、,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const topPoints = points.length ? points.slice(0, 5) : ["高颜值设计", "轻便易用", "耐用材质", "适合送礼", "多场景使用"];
  const languageTone: Record<string, string> = {
    英语: "Everyday Carry",
    日语: "毎日使える",
    韩语: "데일리",
    泰语: "ใช้ง่ายทุกวัน",
    越南语: "tiện dụng mỗi ngày",
    印尼语: "praktis harian",
    西班牙语: "uso diario",
  };
  const styleHook: Record<string, string> = {
    简洁型: "Clean",
    强营销型: "Best Choice",
    高级品牌型: "Premium",
    本土化口语型: "Local Favorite",
    "TikTok 爆款型": "TikTok Viral",
  };
  const prefix = styleHook[input.style] ?? "Smart";
  const tone = languageTone[input.language] ?? "Global";

  return {
    productTitle: `${prefix} ${title} for ${input.market} | ${tone} ${input.platform} Pick`,
    bulletPoints: [
      `围绕“${topPoints[0]}”做首屏记忆点，适合${input.market}用户快速理解价值。`,
      `${topPoints[1] ?? topPoints[0]}设计提升日常使用效率，减少选择成本。`,
      `${topPoints[2] ?? topPoints[0]}材质兼顾质感与耐用度，更适合跨境长周期销售。`,
      `适配${input.platform}内容节奏，可放入短标题、主图角标和详情页核心模块。`,
      `以${input.style}语气强化转化，兼顾搜索关键词与本土化表达。`,
    ],
    detailDescription: `这是一版面向${input.market}${input.platform}用户的${input.language}文案草稿。内容会突出“${topPoints.join(" / ")}”，用${input.style}表达降低理解门槛，并把使用场景、材质优势和购买理由组合成适合详情页首屏到长图模块的叙事。原始描述：${input.description || "暂无详细描述，可在接入真实模型后自动扩写。"}`,
    seoKeywords: [
      title,
      `${input.market} ${title}`,
      `${input.platform} bestseller`,
      ...topPoints.slice(0, 4),
      input.language,
    ],
    platformTags: [`#${input.platform.replace(/\s+/g, "")}`, `#${input.market}`, `#${input.style}`, "#跨境热卖", "#内容生成"],
  };
}

function CopyTextButton({ text, label = "复制" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={[
        "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors",
        copied ? "bg-apple-green/10 text-apple-green" : "bg-apple-gray-50 text-apple-gray-900 hover:bg-apple-gray-100",
      ].join(" ")}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      <span>{copied ? "已复制" : label}</span>
    </button>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1.5 block text-[12px] font-medium text-apple-gray-300">{children}</label>;
}

function ResultBlock({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-apple-gray-100 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-apple-gray-100 px-4 py-3">
        <h3 className="text-[13px] font-semibold text-apple-gray-900">{title}</h3>
        <CopyTextButton text={text} />
      </div>
      <div className="p-4 text-[13px] leading-relaxed text-apple-gray-900">{children}</div>
    </div>
  );
}

export default function CopywritingPage() {
  const [input, setInput] = useState<CopywritingInput>(initialInput);
  const [result, setResult] = useState<CopywritingResult | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setHistory(JSON.parse(raw) as HistoryRecord[]);
    } catch {
      setHistory([]);
    }
  }, []);

  const canGenerate = useMemo(() => input.title.trim() || input.sellingPoints.trim() || input.description.trim(), [input]);

  function updateInput<K extends keyof CopywritingInput>(key: K, value: CopywritingInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function saveRecord(nextResult: CopywritingResult) {
    const record: HistoryRecord = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      input,
      result: nextResult,
    };
    const nextHistory = [record, ...history].slice(0, 12);
    setHistory(nextHistory);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
  }

  function handleGenerate() {
    const nextResult = mockGenerateCopywriting(input);
    setResult(nextResult);
    saveRecord(nextResult);
  }

  function clearHistory() {
    if (!confirm("确认清空所有文案生成历史？此操作不可恢复。")) return;
    setHistory([]);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Languages}
        title="多语言文案生成"
        badge="第六阶段"
        description="输入中文商品信息，按目标平台、市场、语言和风格生成可复制、可保存的跨境商品文案。"
        action={
          <Button icon={Sparkles} onClick={handleGenerate} disabled={!canGenerate}>
            生成文案
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_1fr]">
        <SectionCard title="生成参数" description="先用 mock 逻辑生成，后续可替换为真实模型接口。">
          <div className="space-y-4">
            <div>
              <FieldLabel>中文商品标题</FieldLabel>
              <input
                value={input.title}
                onChange={(event) => updateInput("title", event.target.value)}
                className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
              />
            </div>
            <div>
              <FieldLabel>商品卖点</FieldLabel>
              <textarea
                value={input.sellingPoints}
                onChange={(event) => updateInput("sellingPoints", event.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
              />
            </div>
            <div>
              <FieldLabel>商品描述</FieldLabel>
              <textarea
                value={input.description}
                onChange={(event) => updateInput("description", event.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>目标平台</FieldLabel>
                <select
                  value={input.platform}
                  onChange={(event) => updateInput("platform", event.target.value)}
                  className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
                >
                  {PLATFORMS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>目标市场</FieldLabel>
                <select
                  value={input.market}
                  onChange={(event) => updateInput("market", event.target.value)}
                  className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
                >
                  {MARKETS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <FieldLabel>目标语言</FieldLabel>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {LANGUAGES.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => updateInput("language", item)}
                    className={[
                      "rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors",
                      input.language === item
                        ? "border-apple-blue bg-apple-blue/10 text-apple-blue"
                        : "border-apple-gray-100 bg-white text-apple-gray-900 hover:bg-apple-gray-50",
                    ].join(" ")}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>文案风格</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => updateInput("style", item)}
                    className={[
                      "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                      input.style === item
                        ? "border-apple-blue bg-apple-blue text-white"
                        : "border-apple-gray-100 bg-white text-apple-gray-900 hover:bg-apple-gray-50",
                    ].join(" ")}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="space-y-5">
          <SectionCard
            title="生成结果"
            description="每块内容都可以单独复制，也可以从历史记录恢复。"
            action={result ? <CopyTextButton text={joinResult(result)} label="复制全部" /> : undefined}
          >
            {result ? (
              <div className="space-y-4">
                <ResultBlock title="商品标题" text={result.productTitle}>
                  {result.productTitle}
                </ResultBlock>
                <ResultBlock title="五点卖点" text={result.bulletPoints.map((item, index) => `${index + 1}. ${item}`).join("\n")}>
                  <ol className="space-y-2">
                    {result.bulletPoints.map((item, index) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-apple-blue">{index + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </ResultBlock>
                <ResultBlock title="详情页描述" text={result.detailDescription}>
                  {result.detailDescription}
                </ResultBlock>
                <ResultBlock title="SEO 关键词" text={result.seoKeywords.join(", ")}>
                  <div className="flex flex-wrap gap-2">
                    {result.seoKeywords.map((item) => (
                      <Badge key={item} tone="blue">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </ResultBlock>
                <ResultBlock title="平台标签" text={result.platformTags.join(" ")}>
                  <div className="flex flex-wrap gap-2">
                    {result.platformTags.map((item) => (
                      <Badge key={item} tone="green">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </ResultBlock>
              </div>
            ) : (
              <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-apple-gray-200 bg-apple-gray-50/50 text-center">
                <Sparkles className="mb-3 h-7 w-7 text-apple-gray-300" />
                <div className="text-[14px] font-medium text-apple-gray-900">填写参数后生成文案</div>
                <div className="mt-1 text-[12px] text-apple-gray-300">结果会自动保存到浏览器本地历史。</div>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="历史生成记录"
            description="最多保留最近 12 条 localStorage 记录。"
            action={
              history.length ? (
                <Button variant="secondary" size="sm" icon={Trash2} onClick={clearHistory}>
                  清空
                </Button>
              ) : undefined
            }
          >
            {history.length ? (
              <div className="space-y-3">
                {history.map((record) => (
                  <button
                    type="button"
                    key={record.id}
                    onClick={() => {
                      setInput(record.input);
                      setResult(record.result);
                    }}
                    className="w-full rounded-2xl border border-apple-gray-100 bg-white p-4 text-left transition-colors hover:bg-apple-gray-50"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <History className="h-4 w-4 text-apple-gray-300" />
                      <span className="text-[13px] font-semibold text-apple-gray-900">{record.input.title}</span>
                      <Badge tone="gray" size="sm">
                        {record.input.language}
                      </Badge>
                      <Badge tone="gray" size="sm">
                        {record.input.style}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[12px] text-apple-gray-300">
                      <Save className="h-3.5 w-3.5" />
                      <span>{new Date(record.createdAt).toLocaleString("zh-CN")}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-apple-gray-50 px-4 py-8 text-center text-[13px] text-apple-gray-300">暂无历史记录。</div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

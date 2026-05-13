"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck, FileCheck, Tags, Upload } from "lucide-react";

import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import CopyableBlock, { CopyTextButton } from "@/components/ui/CopyableBlock";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

const PLATFORMS = ["Amazon", "Shopee", "Lazada", "TikTok Shop", "Temu", "独立站"];
const MARKETS = ["美国", "日本", "韩国", "泰国", "越南", "印尼", "西班牙", "墨西哥"];

type ListingInput = {
  name: string;
  category: string;
  cost: number;
  price: number;
  stock: number;
  platform: string;
  market: string;
  supplierUrl: string;
  imageUrl: string;
  sellingPoint: string;
};

type ListingResult = {
  title: string;
  bullets: string[];
  description: string;
  keywords: string[];
  tags: string[];
  categoryAdvice: string;
  priceAdvice: string;
  checklist: string[];
};

const initialInput: ListingInput = {
  name: "便携式折叠收纳包",
  category: "旅行收纳",
  cost: 18,
  price: 29.9,
  stock: 500,
  platform: "TikTok Shop",
  market: "美国",
  supplierUrl: "https://supplier.example.com/item/1001",
  imageUrl: "https://picsum.photos/seed/listing-helper/600/600",
  sellingPoint: "大容量、防水、可折叠、适合旅行健身和日常通勤",
};

function generateListing(input: ListingInput): ListingResult {
  const points = input.sellingPoint
    .split(/[、,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const safePoints = points.length ? points : ["实用", "耐用", "高颜值", "多场景", "轻便"];
  const margin = input.price > 0 ? ((input.price - input.cost) / input.price) * 100 : 0;

  return {
    title: `${input.market}${input.platform}热卖 ${input.name} | ${safePoints.slice(0, 2).join(" ")} ${input.category}`,
    bullets: [
      `${safePoints[0]}：首屏突出核心使用价值，让买家 3 秒内理解产品。`,
      `${safePoints[1] ?? safePoints[0]}：适合${input.market}用户的日常场景表达。`,
      `${safePoints[2] ?? safePoints[0]}：详情页可拆成图文模块，提高转化承接。`,
      `库存 ${input.stock} 件：适合先做小批量测试，再根据转化补货。`,
      `采购价 ${input.cost}，建议售价 ${input.price}，当前毛利空间约 ${margin.toFixed(1)}%。`,
    ],
    description: `${input.name}是一款面向${input.market}${input.platform}用户的${input.category}产品，核心卖点为${safePoints.join("、")}。建议详情页采用“痛点开场 + 产品功能 + 使用场景 + 尺寸材质 + 售后承诺”的结构，主图保持主体清晰，辅助图突出差异化价值。供应商链接：${input.supplierUrl}`,
    keywords: [input.name, input.category, input.platform, input.market, ...safePoints.slice(0, 5)],
    tags: [`#${input.platform.replace(/\s+/g, "")}`, `#${input.market}`, `#${input.category}`, "#新品上架", "#跨境热卖"],
    categoryAdvice: `建议挂靠在「${input.category} / 旅行配件 / 收纳整理」相关类目，并检查${input.platform}是否有更细分的二级类目。`,
    priceAdvice:
      margin >= 35
        ? "当前价格有较好利润空间，可预留 10%-15% 优惠券做冷启动。"
        : margin >= 20
          ? "当前价格可以测试，但广告预算要控制，优先优化转化再放量。"
          : "当前价格利润偏薄，建议提高售价或重新谈采购价与物流成本。",
    checklist: [
      "标题包含核心关键词、使用场景和差异化卖点。",
      "五点卖点不重复，每条只讲一个购买理由。",
      "主图清晰、无侵权元素、无平台禁用词。",
      "详情页包含尺寸、材质、场景、对比和售后信息。",
      "库存、价格、运费模板、发货时效已核对。",
      "供应商链接、图片链接和核心卖点已归档。",
    ],
  };
}

function resultToText(result: ListingResult) {
  return [
    `商品标题：${result.title}`,
    "商品五点卖点：",
    ...result.bullets.map((item, index) => `${index + 1}. ${item}`),
    `商品描述：${result.description}`,
    `SEO 关键词：${result.keywords.join(", ")}`,
    `平台标签：${result.tags.join(" ")}`,
    `类目建议：${result.categoryAdvice}`,
    `价格建议：${result.priceAdvice}`,
    "上架检查清单：",
    ...result.checklist.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n\n");
}

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1.5 block text-[12px] font-medium text-apple-gray-300">{children}</label>;
}

export default function ListingPage() {
  const [input, setInput] = useState<ListingInput>(initialInput);
  const [result, setResult] = useState<ListingResult | null>(null);
  const canGenerate = useMemo(() => input.name.trim().length > 0, [input.name]);

  function update<K extends keyof ListingInput>(key: K, value: ListingInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function handleGenerate() {
    setResult(generateListing(input));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Upload}
        title="上品辅助"
        badge="上架工具"
        description="填写产品基础资料后，自动生成标题、卖点、描述、关键词、标签、类目、价格和检查清单。"
        action={
          <Button icon={FileCheck} onClick={handleGenerate} disabled={!canGenerate}>
            生成上架资料
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[430px_1fr]">
        <SectionCard title="产品资料" description="这些字段会进入 mock 上架生成逻辑。">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>产品名称</FieldLabel>
                <input value={input.name} onChange={(event) => update("name", event.target.value)} className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue" />
              </div>
              <div>
                <FieldLabel>产品类目</FieldLabel>
                <input value={input.category} onChange={(event) => update("category", event.target.value)} className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <FieldLabel>采购价</FieldLabel>
                <input type="number" value={input.cost} onChange={(event) => update("cost", Number(event.target.value))} className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue" />
              </div>
              <div>
                <FieldLabel>建议售价</FieldLabel>
                <input type="number" value={input.price} onChange={(event) => update("price", Number(event.target.value))} className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue" />
              </div>
              <div>
                <FieldLabel>库存</FieldLabel>
                <input type="number" value={input.stock} onChange={(event) => update("stock", Number(event.target.value))} className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>目标平台</FieldLabel>
                <select value={input.platform} onChange={(event) => update("platform", event.target.value)} className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue">
                  {PLATFORMS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>目标市场</FieldLabel>
                <select value={input.market} onChange={(event) => update("market", event.target.value)} className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue">
                  {MARKETS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <FieldLabel>供应商链接</FieldLabel>
              <input value={input.supplierUrl} onChange={(event) => update("supplierUrl", event.target.value)} className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue" />
            </div>
            <div>
              <FieldLabel>产品图片链接</FieldLabel>
              <input value={input.imageUrl} onChange={(event) => update("imageUrl", event.target.value)} className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue" />
            </div>
            <div>
              <FieldLabel>产品核心卖点</FieldLabel>
              <textarea value={input.sellingPoint} onChange={(event) => update("sellingPoint", event.target.value)} rows={3} className="w-full resize-none rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue" />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="生成结果"
          description="结果可以直接复制到平台后台或交给运营复核。"
          action={result ? <CopyTextButton text={resultToText(result)} label="复制全部" /> : undefined}
        >
          {result ? (
            <div className="space-y-4">
              <CopyableBlock title="商品标题" text={result.title}>{result.title}</CopyableBlock>
              <CopyableBlock title="商品五点卖点" text={result.bullets.join("\n")}>
                <ol className="space-y-2">
                  {result.bullets.map((item, index) => (
                    <li key={item}>{index + 1}. {item}</li>
                  ))}
                </ol>
              </CopyableBlock>
              <CopyableBlock title="商品描述" text={result.description}>{result.description}</CopyableBlock>
              <CopyableBlock title="SEO 关键词" text={result.keywords.join(", ")}>
                <div className="flex flex-wrap gap-2">
                  {result.keywords.map((item) => <Badge key={item} tone="blue">{item}</Badge>)}
                </div>
              </CopyableBlock>
              <CopyableBlock title="平台标签" text={result.tags.join(" ")}>
                <div className="flex flex-wrap gap-2">
                  {result.tags.map((item) => <Badge key={item} tone="green">{item}</Badge>)}
                </div>
              </CopyableBlock>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <CopyableBlock title="类目建议" text={result.categoryAdvice}>{result.categoryAdvice}</CopyableBlock>
                <CopyableBlock title="价格建议" text={result.priceAdvice}>{result.priceAdvice}</CopyableBlock>
              </div>
              <CopyableBlock title="上架检查清单" text={result.checklist.join("\n")}>
                <ul className="space-y-2">
                  {result.checklist.map((item) => (
                    <li key={item} className="flex gap-2">
                      <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-apple-green" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CopyableBlock>
            </div>
          ) : (
            <div className="grid min-h-[520px] place-items-center rounded-2xl border border-dashed border-apple-gray-200 bg-apple-gray-50/50 text-center">
              <div>
                <Tags className="mx-auto mb-3 h-8 w-8 text-apple-gray-300" />
                <div className="text-[14px] font-medium text-apple-gray-900">填写资料后生成上架内容</div>
                <div className="mt-1 text-[12px] text-apple-gray-300">标题、卖点、价格和清单会集中展示在这里。</div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

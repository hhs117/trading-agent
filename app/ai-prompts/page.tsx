"use client";

import { useMemo, useState } from "react";
import { Check, ClipboardList, Copy, ImageIcon, LayoutTemplate, Sparkles, Video, Wand2 } from "lucide-react";

import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

const PLATFORMS = ["Amazon", "Shopee", "Lazada", "TikTok Shop", "Instagram", "独立站"];
const COUNTRIES = ["美国", "日本", "韩国", "泰国", "越南", "印尼", "西班牙", "墨西哥"];
const GENERATION_TYPES = ["商品主图", "详情页图", "广告图", "社媒图", "商品短视频脚本"];
const STYLES = ["欧美简洁风", "东南亚高饱和风", "日系清新风", "韩系精致风", "TikTok 爆款风", "Amazon 白底专业风"];

type PromptInput = {
  productName: string;
  category: string;
  country: string;
  platform: string;
  desiredStyle: string;
  coreSellingPoint: string;
  generationType: string;
};

type PromptResult = {
  cnPrompt: string;
  enPrompt: string;
  heroComposition: string;
  detailStructure: string[];
  videoScript: string;
  storyboard: string[];
  cautions: string[];
};

const initialInput: PromptInput = {
  productName: "便携式折叠收纳包",
  category: "旅行收纳",
  country: "美国",
  platform: "TikTok Shop",
  desiredStyle: "TikTok 爆款风",
  coreSellingPoint: "大容量、防水、可折叠、适合旅行和健身",
  generationType: "商品短视频脚本",
};

function mockGeneratePrompt(input: PromptInput): PromptResult {
  const product = input.productName || "产品";
  const category = input.category || "跨境商品";
  const points = input.coreSellingPoint || "高颜值、实用、适合日常使用";

  return {
    cnPrompt: `${product}，${category}类目，面向${input.country}${input.platform}用户，${input.desiredStyle}。画面突出${points}，产品主体清晰，占画面 65%，自然光，真实使用场景，商业摄影质感，干净背景，适合${input.generationType}。`,
    enPrompt: `${product}, ${category} product for ${input.country} ${input.platform}, ${input.desiredStyle}. Highlight ${points}. Clear product hero, 65% frame coverage, natural light, realistic lifestyle scene, commercial photography, clean background, optimized for ${input.generationType}.`,
    heroComposition: `主体置中偏右，左侧保留短卖点文案空间；首屏只放 1 个核心视觉利益点，例如“${points.split(/[、,，]/)[0]}”。背景根据${input.country}审美选择低干扰生活场景，避免道具抢走产品注意力。`,
    detailStructure: [
      `首图：产品全貌 + 一句话利益点，适合${input.platform}首屏停留。`,
      `功能图：拆分展示${points}，每张图只讲一个卖点。`,
      `场景图：放入${input.country}用户熟悉的生活或使用环境。`,
      `对比图：用前后变化或容量对比强调购买理由。`,
      `信任图：材质、尺寸、包装、售后承诺合并到末屏。`,
    ],
    videoScript: `0-3 秒用痛点开场：“出门东西太多还总是乱？” 3-8 秒展示${product}快速展开与装载过程。8-14 秒切换旅行、健身、通勤三个场景。14-18 秒用近景强调${points}。结尾 2 秒给出行动号召：“现在下单，把收纳变简单。”`,
    storyboard: [
      "镜头 1：杂乱行李或桌面快速闪过，制造痛点。",
      `镜头 2：手部拿起${product}，一秒展开，产品主体占满画面。`,
      `镜头 3：依次放入物品，用俯拍表现容量和分类能力。`,
      `镜头 4：切到${input.country}本土化场景，突出真实使用感。`,
      "镜头 5：产品收起后的体积对比，给出购买按钮或促销标签。",
    ],
    cautions: [
      `如果投放${input.platform}，首图避免过多小字和夸张疗效表达。`,
      `面向${input.country}市场时，人物、道具、颜色需要贴近本地审美。`,
      "AI 作图 prompt 中不要混用过多风格词，防止画面失焦。",
      "短视频脚本要保证前 3 秒出现产品或明确痛点。",
    ],
  };
}

function CopyTextButton({ text }: { text: string }) {
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
      <span>{copied ? "已复制" : "复制"}</span>
    </button>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1.5 block text-[12px] font-medium text-apple-gray-300">{children}</label>;
}

function ResultPanel({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
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

function resultToText(result: PromptResult) {
  return [
    `中文提示词：${result.cnPrompt}`,
    `英文提示词：${result.enPrompt}`,
    `主图构图建议：${result.heroComposition}`,
    "详情页图片结构：",
    ...result.detailStructure.map((item, index) => `${index + 1}. ${item}`),
    `视频脚本：${result.videoScript}`,
    "拍摄分镜：",
    ...result.storyboard.map((item, index) => `${index + 1}. ${item}`),
    "注意事项：",
    ...result.cautions.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n\n");
}

export default function AiPromptsPage() {
  const [input, setInput] = useState<PromptInput>(initialInput);
  const [result, setResult] = useState<PromptResult | null>(null);
  const canGenerate = useMemo(() => input.productName.trim() || input.coreSellingPoint.trim(), [input]);

  function updateInput<K extends keyof PromptInput>(key: K, value: PromptInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function handleGenerate() {
    setResult(mockGeneratePrompt(input));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wand2}
        title="AI 图片 / 视频建议"
        badge="Mock 生成"
        description="为主图、详情页、广告图、社媒图和短视频脚本生成中英文 prompt、构图建议与分镜。"
        action={
          <Button icon={Sparkles} onClick={handleGenerate} disabled={!canGenerate}>
            生成建议
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_1fr]">
        <SectionCard title="输入信息" description="把产品和市场讲清楚，mock 结果会按平台和风格组织。">
          <div className="space-y-4">
            <div>
              <FieldLabel>产品名称</FieldLabel>
              <input
                value={input.productName}
                onChange={(event) => updateInput("productName", event.target.value)}
                className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
              />
            </div>
            <div>
              <FieldLabel>产品类目</FieldLabel>
              <input
                value={input.category}
                onChange={(event) => updateInput("category", event.target.value)}
                className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>目标国家</FieldLabel>
                <select
                  value={input.country}
                  onChange={(event) => updateInput("country", event.target.value)}
                  className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
                >
                  {COUNTRIES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
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
            </div>
            <div>
              <FieldLabel>想要风格</FieldLabel>
              <textarea
                value={input.desiredStyle}
                onChange={(event) => updateInput("desiredStyle", event.target.value)}
                rows={2}
                className="w-full resize-none rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
              />
            </div>
            <div>
              <FieldLabel>核心卖点</FieldLabel>
              <textarea
                value={input.coreSellingPoint}
                onChange={(event) => updateInput("coreSellingPoint", event.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
              />
            </div>
            <div>
              <FieldLabel>生成类型</FieldLabel>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {GENERATION_TYPES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => updateInput("generationType", item)}
                    className={[
                      "rounded-xl border px-3 py-2 text-left text-[13px] font-medium transition-colors",
                      input.generationType === item
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
              <FieldLabel>风格模板</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => updateInput("desiredStyle", item)}
                    className={[
                      "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                      input.desiredStyle === item
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

        <SectionCard
          title="生成结果"
          description="内容可直接交给设计、拍摄团队或 AI 作图工具继续迭代。"
          action={result ? <CopyTextButton text={resultToText(result)} /> : undefined}
        >
          {result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ResultPanel title="中文提示词" text={result.cnPrompt}>
                  {result.cnPrompt}
                </ResultPanel>
                <ResultPanel title="英文提示词" text={result.enPrompt}>
                  {result.enPrompt}
                </ResultPanel>
              </div>
              <ResultPanel title="主图构图建议" text={result.heroComposition}>
                {result.heroComposition}
              </ResultPanel>
              <ResultPanel title="详情页图片结构" text={result.detailStructure.join("\n")}>
                <ul className="space-y-2">
                  {result.detailStructure.map((item) => (
                    <li key={item} className="flex gap-2">
                      <LayoutTemplate className="mt-0.5 h-4 w-4 shrink-0 text-apple-blue" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </ResultPanel>
              <ResultPanel title="视频脚本" text={result.videoScript}>
                {result.videoScript}
              </ResultPanel>
              <ResultPanel title="拍摄分镜" text={result.storyboard.join("\n")}>
                <ul className="space-y-2">
                  {result.storyboard.map((item) => (
                    <li key={item} className="flex gap-2">
                      <Video className="mt-0.5 h-4 w-4 shrink-0 text-apple-orange" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </ResultPanel>
              <ResultPanel title="注意事项" text={result.cautions.join("\n")}>
                <div className="flex flex-wrap gap-2">
                  {result.cautions.map((item) => (
                    <Badge key={item} tone="orange">
                      {item}
                    </Badge>
                  ))}
                </div>
              </ResultPanel>
            </div>
          ) : (
            <div className="grid min-h-[520px] place-items-center rounded-2xl border border-dashed border-apple-gray-200 bg-apple-gray-50/50 text-center">
              <div>
                <ImageIcon className="mx-auto mb-3 h-8 w-8 text-apple-gray-300" />
                <div className="text-[14px] font-medium text-apple-gray-900">选择类型并生成视觉建议</div>
                <div className="mt-1 text-[12px] text-apple-gray-300">会输出 prompt、构图、详情页结构、脚本和分镜。</div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { icon: ImageIcon, title: "图片方向", desc: "主图、详情图、广告图和社媒图都可按市场生成。" },
          { icon: Video, title: "视频方向", desc: "包含开场、卖点展示、场景切换和收尾行动号召。" },
          { icon: ClipboardList, title: "交付清单", desc: "中文给内部沟通，英文给作图工具或海外素材团队。" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-2xl border border-apple-gray-100 bg-white p-4">
              <Icon className="mb-3 h-5 w-5 text-apple-blue" />
              <div className="text-[13px] font-semibold text-apple-gray-900">{item.title}</div>
              <div className="mt-1 text-[12px] leading-relaxed text-apple-gray-300">{item.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

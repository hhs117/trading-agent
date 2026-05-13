"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, ClipboardCheck, Copy, ImageOff, Paintbrush, Sparkles } from "lucide-react";

import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

const IMAGE_ISSUES = [
  "背景杂乱",
  "字体不清晰",
  "卖点不突出",
  "图片风格不统一",
  "不符合平台规则",
  "不适合目标国家审美",
  "主体不突出",
  "缺少使用场景",
];

type ReviewResult = {
  summary: string;
  suggestions: string[];
  direction: string;
  designerBrief: string;
  aiPrompt: string;
};

function mockReview(issues: string[], targetCountry: string, platform: string, productName: string): ReviewResult {
  const product = productName.trim() || "当前商品图片";
  const issueText = issues.join("、");

  return {
    summary: `${product}存在${issueText}等问题。当前视觉会影响首屏识别、卖点传达和${platform}转化效率，建议优先处理主体层级、文字可读性和${targetCountry}本土审美匹配。`,
    suggestions: [
      "先把产品主体放大到画面 60%-70%，减少无关道具和复杂背景。",
      "每张图只保留一个核心卖点，标题不超过 10 个中文字或 6 个英文单词。",
      `根据${targetCountry}用户审美调整色彩、人物、场景和生活方式元素。`,
      `检查${platform}主图规则，避免水印、过多促销词、夸张对比和低清晰度素材。`,
    ],
    direction: `建议重做为“清晰产品主体 + 单一卖点 + 本土使用场景”的结构。主图保持干净专业，详情页图再展开功能、尺寸、材质、场景和对比。视觉风格统一为同一套字体、色彩和角标系统。`,
    designerBrief: `请按以下方向修改${product}图片：1. 解决${issueText}；2. 主体放大并保持边缘清晰；3. 删除复杂背景和无关装饰；4. 文案层级改为主标题 + 1 个辅助卖点；5. 统一字体、色彩和图标样式；6. 增加符合${targetCountry}审美的真实使用场景；7. 按${platform}规范导出主图和详情图。`,
    aiPrompt: `${product}, fix ecommerce product image issues: ${issueText}, clean professional composition, product as clear hero subject, consistent typography, strong selling point hierarchy, localized ${targetCountry} lifestyle scene, compliant with ${platform} marketplace rules, high resolution, commercial product photography, no messy background, no unreadable text.`,
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

function resultToText(result: ReviewResult) {
  return [
    `问题总结：${result.summary}`,
    "优化建议：",
    ...result.suggestions.map((item, index) => `${index + 1}. ${item}`),
    `推荐修改方向：${result.direction}`,
    `可发给美工的修改需求：${result.designerBrief}`,
    `AI 作图 prompt：${result.aiPrompt}`,
  ].join("\n\n");
}

export default function ImageReviewPage() {
  const [productName, setProductName] = useState("便携式折叠收纳包");
  const [targetCountry, setTargetCountry] = useState("美国");
  const [platform, setPlatform] = useState("Amazon");
  const [selectedIssues, setSelectedIssues] = useState<string[]>(["背景杂乱", "卖点不突出", "主体不突出"]);
  const [result, setResult] = useState<ReviewResult | null>(null);

  const canGenerate = useMemo(() => selectedIssues.length > 0, [selectedIssues]);

  function toggleIssue(issue: string) {
    setSelectedIssues((prev) => (prev.includes(issue) ? prev.filter((item) => item !== issue) : [...prev, issue]));
  }

  function handleGenerate() {
    setResult(mockReview(selectedIssues, targetCountry, platform, productName));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ImageOff}
        title="美工图片纠错"
        badge="Mock 审核"
        description="选择图片问题后，生成问题总结、优化建议、美工修改需求和可直接投喂 AI 作图工具的 prompt。"
        action={
          <Button icon={Sparkles} onClick={handleGenerate} disabled={!canGenerate}>
            生成纠错方案
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_1fr]">
        <SectionCard title="图片问题选择" description="当前阶段先用问题标签模拟图片审核结果。">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-apple-gray-300">商品名称</label>
                <input
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-apple-gray-300">目标国家</label>
                <input
                  value={targetCountry}
                  onChange={(event) => setTargetCountry(event.target.value)}
                  className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-apple-gray-300">目标平台</label>
              <select
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
                className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
              >
                {["Amazon", "Shopee", "Lazada", "TikTok Shop", "独立站", "Temu"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {IMAGE_ISSUES.map((issue) => {
                const active = selectedIssues.includes(issue);
                return (
                  <button
                    key={issue}
                    type="button"
                    onClick={() => toggleIssue(issue)}
                    className={[
                      "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-[13px] font-medium transition-colors",
                      active
                        ? "border-apple-blue bg-apple-blue/10 text-apple-blue"
                        : "border-apple-gray-100 bg-white text-apple-gray-900 hover:bg-apple-gray-50",
                    ].join(" ")}
                  >
                    <span>{issue}</span>
                    {active && <Check className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
            <div className="rounded-2xl bg-apple-gray-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-apple-gray-900">
                <AlertTriangle className="h-4 w-4 text-apple-orange" />
                已选问题
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedIssues.length ? (
                  selectedIssues.map((issue) => (
                    <Badge key={issue} tone="orange">
                      {issue}
                    </Badge>
                  ))
                ) : (
                  <span className="text-[12px] text-apple-gray-300">至少选择一个图片问题。</span>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="纠错结果"
          description="每一块都能单独复制，便于直接派单给美工或继续 AI 改图。"
          action={result ? <CopyTextButton text={resultToText(result)} /> : undefined}
        >
          {result ? (
            <div className="space-y-4">
              <ResultPanel title="问题总结" text={result.summary}>
                {result.summary}
              </ResultPanel>
              <ResultPanel title="优化建议" text={result.suggestions.join("\n")}>
                <ul className="space-y-2">
                  {result.suggestions.map((item) => (
                    <li key={item} className="flex gap-2">
                      <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-apple-green" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </ResultPanel>
              <ResultPanel title="推荐修改方向" text={result.direction}>
                {result.direction}
              </ResultPanel>
              <ResultPanel title="可直接发给美工的修改需求" text={result.designerBrief}>
                {result.designerBrief}
              </ResultPanel>
              <ResultPanel title="可直接发给 AI 作图工具的 prompt" text={result.aiPrompt}>
                <div className="font-mono text-[12px] leading-relaxed text-apple-gray-900">{result.aiPrompt}</div>
              </ResultPanel>
            </div>
          ) : (
            <div className="grid min-h-[520px] place-items-center rounded-2xl border border-dashed border-apple-gray-200 bg-apple-gray-50/50 text-center">
              <div>
                <Paintbrush className="mx-auto mb-3 h-8 w-8 text-apple-gray-300" />
                <div className="text-[14px] font-medium text-apple-gray-900">选择图片问题后生成纠错方案</div>
                <div className="mt-1 text-[12px] text-apple-gray-300">输出可以直接给美工、运营或 AI 作图工具使用。</div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

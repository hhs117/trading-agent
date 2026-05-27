"use client";

import { useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";

import { LANGUAGE_LABELS, type Copywriting, type Language } from "@/lib/types";
import type { MockProduct } from "@/data/mockData";
import { logActivity } from "@/data/activity";
import { saveApiProduct } from "@/lib/api/products";
import { generateCopywritingWithAi } from "@/lib/api/ai";

const LANGS: Language[] = ["en", "th", "vi", "id", "ms"];

export default function CopywritingTab({
  product,
  onUpdated,
}: {
  product: MockProduct;
  onUpdated: () => void;
}) {
  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copywritings, setCopywritings] = useState<Copywriting[]>(product.copywritings ?? []);

  const current = copywritings.find((c) => c.language === language);

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const aiResult = await generateCopywritingWithAi({
        title: product.name,
        sellingPoints: product.notes ?? "",
        description: product.notes ?? "",
        platform: product.platform,
        market: product.targetMarket.join(", "),
        language: LANGUAGE_LABELS[language],
        style: "简洁型",
      });
      if (!aiResult) {
        setError("AI 文案接口暂不可用，请先检查 AI_PROVIDER 和 API Key 配置。");
        return;
      }
      const result: Copywriting = {
        language,
        title: aiResult.productTitle,
        bullets: aiResult.bulletPoints,
        description: aiResult.detailDescription,
        keywords: aiResult.seoKeywords,
      };
      const next = [...copywritings.filter((c) => c.language !== language), result];
      setCopywritings(next);
      const nextProduct: MockProduct = {
        ...product,
        copywritings: next,
        updatedAt: new Date().toISOString(),
      };
      const savedProduct = await saveApiProduct(nextProduct);
      if (!savedProduct) {
        setError("文案已生成，但保存到产品数据库失败，请检查数据库连接。");
        return;
      }
      logActivity({
        type: "copywriting_generated",
        productId: product.id,
        productName: product.name,
        detail: `生成 ${LANGUAGE_LABELS[language]} 文案`,
      });
      onUpdated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* 语言切换 + 生成按钮 */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap bg-apple-gray-50 rounded-xl p-1">
          {LANGS.map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={[
                "px-3.5 py-1.5 text-[12px] rounded-lg transition",
                language === lang
                  ? "bg-white text-apple-gray-900 shadow-soft font-medium"
                  : "text-apple-gray-300 hover:text-apple-gray-900",
              ].join(" ")}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-white bg-apple-blue hover:bg-blue-600 transition disabled:opacity-60"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? "生成中…" : current ? "重新生成" : "一键生成"}
        </button>
      </div>
      {error && (
        <div className="rounded-xl border border-apple-red/20 bg-apple-red/5 px-4 py-3 text-[12.5px] text-apple-red">
          {error}
        </div>
      )}

      {!current ? (
        <div className="text-center py-16 text-apple-gray-300 text-[13px]">
          点击右上角「一键生成」获取 {LANGUAGE_LABELS[language]} 文案
        </div>
      ) : (
        <div className="space-y-4">
          <CopyBlock label="商品标题" text={current.title} />
          <CopyBlock label="五点卖点" text={current.bullets.join("\n")} multiline />
          <CopyBlock label="详情页文案" text={current.description} multiline />
          <CopyBlock label="搜索关键词" text={current.keywords.join(", ")} />
        </div>
      )}
    </div>
  );
}

function CopyBlock({
  label,
  text,
  multiline = false,
}: {
  label: string;
  text: string;
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="border border-apple-gray-100 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-apple-gray-50/60">
        <div className="text-[12px] font-medium text-apple-gray-900">{label}</div>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 text-[11px] text-apple-blue hover:underline"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <div
        className={[
          "px-4 py-3 text-[13px] text-apple-gray-900",
          multiline ? "whitespace-pre-line leading-relaxed" : "",
        ].join(" ")}
      >
        {text}
      </div>
    </div>
  );
}

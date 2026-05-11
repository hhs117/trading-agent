"use client";

import { useState } from "react";
import { AlertCircle, Check, Image as ImageIcon, Sparkles, X } from "lucide-react";

import { reviewImage } from "@/lib/mockAI";
import { upsertProduct } from "@/lib/storage";
import type { ImageReview, Product } from "@/lib/types";

export default function ImageReviewTab({
  product,
  onUpdated,
}: {
  product: Product;
  onUpdated: () => void;
}) {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<ImageReview[]>(product.imageReviews ?? []);

  async function handleAnalyze() {
    if (!imageUrl.trim()) return;
    setLoading(true);
    try {
      const review = await reviewImage(imageUrl.trim(), product);
      const next = [review, ...reviews];
      setReviews(next);
      setImageUrl("");
      upsertProduct({ ...product, imageReviews: next, updatedAt: new Date().toISOString() });
      onUpdated();
    } finally {
      setLoading(false);
    }
  }

  function handleRemove(idx: number) {
    const next = reviews.filter((_, i) => i !== idx);
    setReviews(next);
    upsertProduct({ ...product, imageReviews: next, updatedAt: new Date().toISOString() });
    onUpdated();
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="粘贴产品图片 URL（如 https://example.com/img.jpg）"
          className="flex-1 bg-apple-gray-50 rounded-xl py-2.5 px-3.5 text-[13px] outline-none focus:ring-2 focus:ring-apple-blue/30"
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !imageUrl.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-white bg-apple-blue hover:bg-blue-600 transition disabled:opacity-60"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? "分析中…" : "分析图片"}
        </button>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-16 text-apple-gray-300 text-[13px]">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
          上方粘贴图片链接，系统会给出本地化与点击率优化建议
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r, i) => (
            <div key={i} className="border border-apple-gray-100 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <a
                  href={r.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[12px] text-apple-blue hover:underline truncate max-w-md"
                >
                  {r.imageUrl}
                </a>
                <button
                  onClick={() => handleRemove(i)}
                  className="p-1.5 rounded-lg text-apple-gray-300 hover:text-apple-red hover:bg-apple-red/5 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <Checkpoint pass={!r.hasChinese} label="不含中文" failLabel="含中文需替换" />
                <Checkpoint pass={!r.isCluttered} label="排版整洁" failLabel="排版过于杂乱" />
                <Checkpoint pass={r.hasSellingPoint} label="卖点突出" failLabel="缺少卖点元素" />
              </div>

              <Tip title="本地化建议" content={r.localizationTip} />
              <Tip title="主图点击率优化" content={r.ctrTip} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Checkpoint({ pass, label, failLabel }: { pass: boolean; label: string; failLabel: string }) {
  return (
    <div
      className={[
        "flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px]",
        pass ? "bg-apple-green/10 text-apple-green" : "bg-apple-orange/10 text-apple-orange",
      ].join(" ")}
    >
      {pass ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      <span className="font-medium">{pass ? label : failLabel}</span>
    </div>
  );
}

function Tip({ title, content }: { title: string; content: string }) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="text-[12px] font-medium text-apple-gray-900 mb-1">{title}</div>
      <div className="text-[12px] text-apple-gray-300 leading-relaxed">{content}</div>
    </div>
  );
}

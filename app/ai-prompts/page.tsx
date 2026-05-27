"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download, ImageIcon, Loader2, Sparkles, Wand2 } from "lucide-react";

import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import {
  generateImageWithAi,
  type GeneratedImage,
  type ImageGenerationInput,
} from "@/lib/api/imageGeneration";

const PLATFORMS = ["TikTok Shop", "Shopee", "Lazada", "Amazon", "Instagram", "独立站"];
const MARKETS = ["美国", "英国", "泰国", "马来西亚", "菲律宾", "新加坡", "越南", "印尼"];
const IMAGE_TYPES = ["商品主图", "详情页场景图", "广告图", "社媒图", "白底图", "透明背景素材"];
const STYLES = ["欧美极简", "东南亚高饱和", "TikTok 爆款", "Amazon 专业白底", "生活方式摄影", "高级质感棚拍"];
const SIZES: Array<NonNullable<ImageGenerationInput["size"]>> = ["1024x1024", "1024x1536", "1536x1024"];
const QUALITIES: Array<NonNullable<ImageGenerationInput["quality"]>> = ["medium", "high", "low"];
const BACKGROUNDS: Array<NonNullable<ImageGenerationInput["background"]>> = ["auto", "opaque", "transparent"];

type FormState = {
  productName: string;
  category: string;
  platform: string;
  market: string;
  imageType: string;
  style: string;
  sellingPoints: string;
  customPrompt: string;
  size: NonNullable<ImageGenerationInput["size"]>;
  quality: NonNullable<ImageGenerationInput["quality"]>;
  background: NonNullable<ImageGenerationInput["background"]>;
};

const initialForm: FormState = {
  productName: "",
  category: "",
  platform: "TikTok Shop",
  market: "美国",
  imageType: "商品主图",
  style: "生活方式摄影",
  sellingPoints: "",
  customPrompt: "",
  size: "1024x1024",
  quality: "medium",
  background: "auto",
};

function buildPrompt(form: FormState) {
  const product = form.productName.trim() || "the product";
  const category = form.category.trim() || "cross-border ecommerce product";
  const sellingPoints = form.sellingPoints.trim() || "practical, visually appealing, easy to understand";
  const custom = form.customPrompt.trim();

  return [
    `Create a ${form.imageType} for ${product}, a ${category}.`,
    `Target marketplace: ${form.platform}. Target market: ${form.market}.`,
    `Visual style: ${form.style}.`,
    `Highlight these selling points: ${sellingPoints}.`,
    "Make the product the clear hero subject, commercial ecommerce photography, high resolution, clean composition, realistic lighting.",
    "Avoid messy background, unreadable text, exaggerated medical or guarantee claims, watermarks, platform logos, and brand infringement.",
    custom ? `Extra direction: ${custom}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function imageSrc(image: GeneratedImage | null) {
  if (!image) return "";
  if (image.b64Json) return `data:${image.mimeType};base64,${image.b64Json}`;
  return image.url ?? "";
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1 rounded-lg bg-apple-gray-50 px-2.5 py-1 text-[12px] font-medium text-apple-gray-900 hover:bg-apple-gray-100"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-apple-green" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "已复制" : "复制 prompt"}
    </button>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1.5 block text-[12px] font-medium text-apple-gray-300">{children}</label>;
}

export default function AiPromptsPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<GeneratedImage | null>(null);
  const [model, setModel] = useState("");
  const [message, setMessage] = useState("");

  const prompt = useMemo(() => buildPrompt(form), [form]);
  const canGenerate = prompt.trim().length >= 8 && !loading;
  const src = imageSrc(image);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (message) setMessage("");
  }

  async function handleGenerate() {
    setLoading(true);
    setMessage("");
    setImage(null);
    const response = await generateImageWithAi({
      prompt,
      productName: form.productName,
      platform: form.platform,
      market: form.market,
      imageType: form.imageType,
      style: form.style,
      size: form.size,
      quality: form.quality,
      background: form.background,
    });
    setLoading(false);

    if (!response.ok || !response.image) {
      setMessage(response.message || "生图失败，请检查 OPENAI_API_KEY 或稍后重试。");
      return;
    }

    setImage(response.image);
    setModel(response.model ?? "");
    setMessage("图片已生成。");
  }

  function downloadImage() {
    if (!src) return;
    const link = document.createElement("a");
    link.href = src;
    link.download = `${form.productName || "seapick-image"}.png`;
    link.click();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wand2}
        title="AI 生图"
        badge="OpenAI Images"
        description="输入商品、平台、市场和卖点，直接生成可用于主图、详情图、广告图或社媒图的电商图片。"
        action={
          <Button icon={loading ? Loader2 : Sparkles} onClick={handleGenerate} disabled={!canGenerate}>
            {loading ? "生成中" : "生成图片"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[430px_1fr]">
        <SectionCard title="生图参数" description="参数会被组织成英文 prompt 发送给图像模型。">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>商品名称</FieldLabel>
                <input
                  value={form.productName}
                  onChange={(event) => update("productName", event.target.value)}
                  className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
                  placeholder="例如：折叠收纳包"
                />
              </div>
              <div>
                <FieldLabel>商品类目</FieldLabel>
                <input
                  value={form.category}
                  onChange={(event) => update("category", event.target.value)}
                  className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
                  placeholder="例如：旅行收纳"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>目标平台</FieldLabel>
                <select
                  value={form.platform}
                  onChange={(event) => update("platform", event.target.value)}
                  className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
                >
                  {PLATFORMS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>目标市场</FieldLabel>
                <select
                  value={form.market}
                  onChange={(event) => update("market", event.target.value)}
                  className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
                >
                  {MARKETS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
            </div>

            <div>
              <FieldLabel>图片类型</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {IMAGE_TYPES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => update("imageType", item)}
                    className={[
                      "rounded-xl border px-3 py-2 text-left text-[12.5px] font-medium transition-colors",
                      form.imageType === item
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
              <FieldLabel>视觉风格</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => update("style", item)}
                    className={[
                      "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                      form.style === item
                        ? "border-apple-blue bg-apple-blue text-white"
                        : "border-apple-gray-100 bg-white text-apple-gray-900 hover:bg-apple-gray-50",
                    ].join(" ")}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>核心卖点</FieldLabel>
              <textarea
                value={form.sellingPoints}
                onChange={(event) => update("sellingPoints", event.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
                placeholder="例如：防水、大容量、可折叠、轻便、适合旅行"
              />
            </div>

            <div>
              <FieldLabel>补充要求</FieldLabel>
              <textarea
                value={form.customPrompt}
                onChange={(event) => update("customPrompt", event.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
                placeholder="例如：左侧留白放文字，不要人物，不要文字水印"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <FieldLabel>尺寸</FieldLabel>
                <select value={form.size} onChange={(event) => update("size", event.target.value as FormState["size"])} className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue">
                  {SIZES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>质量</FieldLabel>
                <select value={form.quality} onChange={(event) => update("quality", event.target.value as FormState["quality"])} className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue">
                  {QUALITIES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>背景</FieldLabel>
                <select value={form.background} onChange={(event) => update("background", event.target.value as FormState["background"])} className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue">
                  {BACKGROUNDS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="生成结果"
          description="生成成功后会在这里预览图片，并可下载。"
          action={src ? (
            <div className="flex gap-2">
              <CopyButton text={prompt} />
              <button type="button" onClick={downloadImage} className="inline-flex items-center gap-1 rounded-lg bg-apple-blue px-2.5 py-1 text-[12px] font-medium text-white hover:bg-blue-600">
                <Download className="h-3.5 w-3.5" />
                下载
              </button>
            </div>
          ) : <CopyButton text={prompt} />}
        >
          <div className="space-y-4">
            {message && (
              <div className="rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-4 py-3 text-[12.5px] text-apple-gray-900">
                {message}
                {model ? <span className="ml-2 text-apple-gray-300">Model: {model}</span> : null}
              </div>
            )}

            {loading ? (
              <div className="grid min-h-[520px] place-items-center rounded-2xl border border-dashed border-apple-gray-200 bg-apple-gray-50/50 text-center">
                <div>
                  <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-apple-blue" />
                  <div className="text-[14px] font-medium text-apple-gray-900">正在生成图片</div>
                  <div className="mt-1 text-[12px] text-apple-gray-300">通常需要几十秒，取决于质量和模型负载。</div>
                </div>
              </div>
            ) : src ? (
              <div className="space-y-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="AI generated product visual" className="max-h-[720px] w-full rounded-2xl border border-apple-gray-100 bg-apple-gray-50 object-contain" />
                {image?.revisedPrompt ? (
                  <div className="rounded-2xl border border-apple-gray-100 bg-white p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="text-[13px] font-semibold text-apple-gray-900">模型优化后的 prompt</div>
                      <CopyButton text={image.revisedPrompt} />
                    </div>
                    <div className="text-[12.5px] leading-relaxed text-apple-gray-300">{image.revisedPrompt}</div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="grid min-h-[520px] place-items-center rounded-2xl border border-dashed border-apple-gray-200 bg-apple-gray-50/50 text-center">
                <div>
                  <ImageIcon className="mx-auto mb-3 h-8 w-8 text-apple-gray-300" />
                  <div className="text-[14px] font-medium text-apple-gray-900">填写参数后生成图片</div>
                  <div className="mt-1 text-[12px] text-apple-gray-300">适合电商主图、详情图、广告图和社媒素材。</div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-apple-gray-100 bg-white p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-[13px] font-semibold text-apple-gray-900">当前 prompt</div>
                <Badge tone="gray">{form.imageType}</Badge>
              </div>
              <pre className="whitespace-pre-wrap break-words text-[12px] leading-relaxed text-apple-gray-300">{prompt}</pre>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

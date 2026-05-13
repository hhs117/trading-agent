"use client";

import { useState } from "react";
import { Bot, Languages, MessageSquare, Send, Sparkles } from "lucide-react";

import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import CopyableBlock, { CopyTextButton } from "@/components/ui/CopyableBlock";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

const QUESTION_TYPES = ["物流延迟", "退款问题", "产品咨询", "差评安抚", "订单取消", "售后补发", "尺码问题", "质量问题"];
const LANGUAGES = ["中文", "英语", "日语", "韩语", "泰语", "越南语", "印尼语", "西班牙语"];

type ReplyResult = {
  reply: string;
  polite: string;
  short: string;
  soothing: string;
};

const templates: Record<string, string> = {
  物流延迟: "很抱歉让您久等了。我们已经为您查询订单物流，目前包裹仍在运输节点更新中，我会持续跟进并在有新状态后第一时间通知您。",
  退款问题: "我们理解您的退款需求。请您提供订单号和问题照片，我们会尽快核实订单状态，并按平台规则为您处理退款或其他解决方案。",
  产品咨询: "感谢您的咨询。这款产品适合日常使用，核心优势是轻便、耐用和多场景适配。如果您有具体使用场景，我也可以帮您确认是否合适。",
  差评安抚: "非常抱歉这次体验没有达到您的期待。我们重视您的反馈，会马上核实问题原因，并尽力为您提供补偿、换货或其他处理方案。",
  订单取消: "我们已收到您的取消订单需求。若订单尚未发货，我们会尽快协助取消；若已发货，则需要按平台规则等待物流状态后继续处理。",
  售后补发: "很抱歉给您带来不便。请您提供订单号和问题图片，我们核实后会尽快安排补发或给出对应售后方案。",
  尺码问题: "感谢您的反馈。不同批次和测量方式可能存在轻微误差，建议您提供身高、体重或实际测量数据，我们会帮您确认更合适的尺码。",
  质量问题: "很抱歉产品出现质量问题。请您提供清晰照片或视频，我们会优先核实并尽快给您补发、退款或其他售后处理。",
};

function localize(text: string, language: string) {
  if (language === "中文") return text;
  return `[${language} mock] ${text}`;
}

function generateReply(type: string, language: string, customerMessage: string): ReplyResult {
  const base = templates[type] ?? templates["产品咨询"];
  const context = customerMessage.trim() ? `关于您提到的“${customerMessage.trim()}”，` : "";
  return {
    reply: localize(`${context}${base}`, language),
    polite: localize(`您好，感谢您联系我们。${context}${base}谢谢您的理解与耐心，我们会认真为您处理。`, language),
    short: localize(`${context}${base.split("。")[0]}。我会继续为您跟进。`, language),
    soothing: localize(`非常理解您现在的担心，也很抱歉给您带来不便。${context}${base}请放心，我会把这个问题优先记录并持续跟进。`, language),
  };
}

function resultToText(result: ReplyResult) {
  return [`客服回复：${result.reply}`, `更礼貌版本：${result.polite}`, `更简短版本：${result.short}`, `安抚型版本：${result.soothing}`].join("\n\n");
}

export default function ChatbotPage() {
  const [questionType, setQuestionType] = useState("物流延迟");
  const [language, setLanguage] = useState("英语");
  const [customerMessage, setCustomerMessage] = useState("My package has not arrived yet.");
  const [result, setResult] = useState<ReplyResult | null>(null);

  function handleGenerate() {
    setResult(generateReply(questionType, language, customerMessage));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MessageSquare}
        title="客服机器人"
        badge="话术生成"
        description="按问题类型和语言生成客服回复、礼貌版、简短版和安抚版，方便客服一键复制。"
        action={
          <Button icon={Send} onClick={handleGenerate}>
            生成回复
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_1fr]">
        <SectionCard title="客服场景" description="选择问题类型、目标语言，并可补充客户原话。">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-apple-gray-300">问题类型</label>
              <div className="grid grid-cols-2 gap-2">
                {QUESTION_TYPES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuestionType(item)}
                    className={[
                      "rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors",
                      questionType === item ? "border-apple-blue bg-apple-blue/10 text-apple-blue" : "border-apple-gray-100 bg-white text-apple-gray-900 hover:bg-apple-gray-50",
                    ].join(" ")}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-apple-gray-300">语言</label>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLanguage(item)}
                    className={[
                      "rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors",
                      language === item ? "border-apple-blue bg-apple-blue text-white" : "border-apple-gray-100 bg-white text-apple-gray-900 hover:bg-apple-gray-50",
                    ].join(" ")}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-apple-gray-300">客户原话</label>
              <textarea
                value={customerMessage}
                onChange={(event) => setCustomerMessage(event.target.value)}
                rows={5}
                className="w-full resize-none rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="生成结果"
          description="所有话术均为 mock 文案，真实接入模型后可替换生成逻辑。"
          action={result ? <CopyTextButton text={resultToText(result)} label="复制全部" /> : undefined}
        >
          {result ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge tone="blue">{questionType}</Badge>
                <Badge tone="green">{language}</Badge>
              </div>
              <CopyableBlock title="客服回复" text={result.reply}>{result.reply}</CopyableBlock>
              <CopyableBlock title="更礼貌版本" text={result.polite}>{result.polite}</CopyableBlock>
              <CopyableBlock title="更简短版本" text={result.short}>{result.short}</CopyableBlock>
              <CopyableBlock title="安抚型版本" text={result.soothing}>{result.soothing}</CopyableBlock>
            </div>
          ) : (
            <div className="grid min-h-[440px] place-items-center rounded-2xl border border-dashed border-apple-gray-200 bg-apple-gray-50/50 text-center">
              <div>
                <Bot className="mx-auto mb-3 h-8 w-8 text-apple-gray-300" />
                <div className="text-[14px] font-medium text-apple-gray-900">选择场景后生成客服回复</div>
                <div className="mt-1 text-[12px] text-apple-gray-300">支持多语言和不同语气版本。</div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="rounded-2xl border border-apple-gray-100 bg-white p-4">
        <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-apple-gray-900">
          <Languages className="h-4 w-4 text-apple-blue" />
          使用提醒
        </div>
        <p className="text-[12px] leading-relaxed text-apple-gray-300">
          当前多语言为 mock 标记文本，用于验证客服工作流；后续接入真实翻译/大模型后，可保留同一套问题类型和语气切换。
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Bot, Languages, MessageSquare, Send } from "lucide-react";

import { Button } from "@/components/ui/Button";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

const QUESTION_TYPES = ["物流延迟", "退款问题", "产品咨询", "差评安抚", "订单取消", "售后补发", "尺码问题", "质量问题"];
const LANGUAGES = ["中文", "英语", "日语", "韩语", "泰语", "越南语", "印尼语", "西班牙语"];

export default function ChatbotPage() {
  const [questionType, setQuestionType] = useState("物流延迟");
  const [language, setLanguage] = useState("英语");
  const [customerMessage, setCustomerMessage] = useState("");
  const [message, setMessage] = useState("");

  function handleGenerate() {
    setMessage("客服回复真实 AI 接口还没有接入，当前不会生成本地模拟话术。");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MessageSquare}
        title="客服机器人"
        badge="待接入 AI 接口"
        description="按问题类型和语言生成客服回复、礼貌版、简短版和安抚版。"
        action={
          <Button icon={Send} onClick={handleGenerate}>
            生成回复
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_1fr]">
        <SectionCard title="客服场景" description="选择问题类型、目标语言，并补充客户原话。">
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
                onChange={(event) => {
                  setCustomerMessage(event.target.value);
                  if (message) setMessage("");
                }}
                rows={5}
                className="w-full resize-none rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
              />
            </div>
            {message && (
              <div className="rounded-xl border border-apple-orange/20 bg-apple-orange/5 px-4 py-3 text-[12.5px] text-apple-orange">
                {message}
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="生成结果" description="接入真实 AI 接口后展示可复制的话术版本。">
          <EmptyState
            icon={Bot}
            title="暂无真实客服回复"
            description="当前已移除本地模拟话术。后续可接入 /api/ai/customer-reply 生成多语言客服回复。"
          />
        </SectionCard>
      </div>

      <div className="rounded-2xl border border-apple-gray-100 bg-white p-4">
        <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-apple-gray-900">
          <Languages className="h-4 w-4 text-apple-blue" />
          接口建议
        </div>
        <p className="text-[12px] leading-relaxed text-apple-gray-300">
          建议新增 /api/ai/customer-reply，输入问题类型、语言和客户原话，返回客服回复、礼貌版、简短版和安抚版。
        </p>
      </div>
    </div>
  );
}

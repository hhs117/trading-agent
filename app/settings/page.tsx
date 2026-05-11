"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { saveProducts } from "@/lib/storage";

export default function SettingsPage() {
  const [cleared, setCleared] = useState(false);

  function handleClear() {
    if (!confirm("将清空所有本地产品数据，此操作不可恢复，是否继续？")) return;
    saveProducts([]);
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-2xl fade-in">
      <Card>
        <CardHeader title="数据存储" />
        <CardBody className="space-y-4">
          <div className="text-[13px] text-apple-gray-300 leading-relaxed">
            当前 MVP 演示版本使用浏览器 <code className="px-1.5 py-0.5 bg-apple-gray-50 rounded text-apple-gray-900">localStorage</code> 保存数据，仅在当前浏览器有效。清空缓存或更换浏览器后数据会丢失。
          </div>
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded-xl text-[13px] font-medium text-white bg-apple-red hover:opacity-90 transition"
          >
            清空所有数据
          </button>
          {cleared && <span className="ml-3 text-[12px] text-apple-green">✓ 已清空，刷新看板将重新生成示例数据</span>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="AI 服务（即将推出）" />
        <CardBody className="space-y-3">
          <div className="text-[13px] text-apple-gray-300 leading-relaxed">
            后续版本将支持配置 Anthropic Claude / OpenAI API Key，用真实大模型生成多语言文案与图片建议。
          </div>
          <input
            disabled
            placeholder="sk-…（暂不可用）"
            className="w-full bg-apple-gray-50 rounded-xl py-2.5 px-3.5 text-[13px] outline-none text-apple-gray-300"
          />
        </CardBody>
      </Card>
    </div>
  );
}

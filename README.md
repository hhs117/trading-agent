# SEAPick · 东南亚跨境选品分析（MVP）

面向 Shopee / Lazada / TikTok Shop 卖家的「选品决策 + AI 上架」工作台。

## 技术栈

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS（苹果风设计系统）
- Recharts（雷达图 / 饼图 / 柱状图）
- Lucide React（图标）
- localStorage（本地数据持久化）

## 功能页面

- `/` 数据看板（6 指标 + 国家分布 + 品类评分）
- `/products` 产品库（筛选 + 卡片网格）
- `/products/new` 新建产品（含毛利率实时计算）
- `/products/[id]` 产品详情，三个 Tab：
  - 九宫格打分（9 维度滑块 + 雷达图 + 推荐等级）
  - 多语言文案（EN/TH/VI/ID/MS）
  - 图片优化建议
- `/settings` 设置（数据清空）

## 本地运行

```bash
# 1. 安装依赖（首次）
npm install
# 或 pnpm install / yarn

# 2. 启动开发服务
npm run dev

# 3. 浏览器访问
http://localhost:3000
```

首次访问 Dashboard 会自动写入 3 条示例产品到 localStorage。点击「设置 → 清空所有数据」后刷新页面会重新生成示例。

## 注意事项

- 数据保存在浏览器 `localStorage`，更换浏览器或清除缓存会丢失。
- 文案与图片建议为本地 mock 生成（含 600ms 延迟模拟 AI 调用），暂未接入真实 LLM。
- 后续版本将接入 Claude / OpenAI API、SQLite + 用户体系。

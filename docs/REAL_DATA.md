# SEAPick Real Data Integration

本项目现在已经预留真实数据入口。生产环境只要配置 `DATABASE_URL`，产品库和部分生成记录会优先走后端 API；没有配置数据库时，页面会继续回退到现有 mock/localStorage 演示数据。

## 已接入的 API

- `GET /api/health`
  - 查看服务状态、数据库是否配置、AI 是否配置。
- `GET /api/products`
  - 从 PostgreSQL 读取产品列表。
- `POST /api/products`
  - 新建产品。
- `GET /api/products/:id`
  - 读取单个产品。
- `PUT /api/products/:id`
  - 更新产品，包含评分、文案、图片审核等扩展字段。
- `DELETE /api/products/:id`
  - 删除产品。
- `GET /api/generation-records?kind=copywriting`
  - 读取文案生成历史。
- `GET /api/generation-records?kind=finance`
  - 读取财务测算历史。
- `POST /api/generation-records`
  - 保存生成类记录。
- `DELETE /api/generation-records?id=xxx`
  - 删除单条生成记录。
- `DELETE /api/generation-records?kind=copywriting`
  - 清空某类生成记录。
- `POST /api/ai/copywriting`
  - 使用 OpenAI 生成多语言商品文案。没有配置 `OPENAI_API_KEY` 时，前端会自动回退到 mock 生成。

## 数据库

支持 Neon、Supabase、Vercel Postgres 或普通 PostgreSQL。表结构见：

```txt
database/schema.sql
```

应用启动时，API 会自动执行 `CREATE TABLE IF NOT EXISTS`，所以首次部署只需要配置：

```env
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5-mini
```

## 当前前端策略

- 产品列表、新建、详情、删除：优先调用 `/api/products`。
- 产品评分、详情页文案、图片审核：更新后会同步调用 `/api/products/:id`。
- 多语言文案历史：优先调用 `/api/generation-records?kind=copywriting`。
- 多语言文案生成：优先调用 `/api/ai/copywriting`，失败时使用本地 mock。
- 财务利润历史：优先调用 `/api/generation-records?kind=finance`。
- API 不可用或没有 `DATABASE_URL`：自动回退到 localStorage。

## 后续建议

下一步可以继续把这些模块接入真实服务：

- `/api/ai/copywriting`
- `/api/ai/image-prompts`
- `/api/ai/image-review`
- `/api/ai/customer-reply`
- `/api/search-products`
- `/api/platform-metrics`
- `/api/logistics/:orderNo`
- `/api/security/status`

接第三方平台前，建议先做登录/租户模型，把每个用户或店铺的数据隔离开。

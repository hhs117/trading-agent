# SEAPick Real Data Integration

本项目已经预留真实数据入口。生产环境配置 `DATABASE_URL` 后，产品库和部分生成记录会优先走后端 API；没有配置数据库时，页面会继续回退到 mock/localStorage 演示数据。

## 已接入的 API

- `GET /api/health`
  - 查看服务状态、数据库是否配置、AI 是否配置、当前 AI provider 和模型。
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
  - 使用 AI 生成多语言商品文案。支持 DeepSeek 和 OpenAI；没有配置密钥时，前端会自动回退到 mock 生成。
- `GET /api/scoring-records`
  - 读取九宫格评分历史，可按 `productId` 过滤。
- `POST /api/scoring-records`
  - 保存九宫格评分记录。
- `DELETE /api/scoring-records?id=xxx`
  - 删除九宫格评分记录。
- `GET /api/compare-items`
  - 读取当前登录账号的竞品对比列表。
- `PUT /api/compare-items`
  - 保存当前登录账号的竞品对比列表。

## 环境变量

支持 Neon、Supabase、Vercel Postgres 或普通 PostgreSQL。表结构见：

```txt
database/schema.sql
```

应用启动时，API 会自动执行 `CREATE TABLE IF NOT EXISTS`，所以首次部署只需要配置：

```env
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE
BOOTSTRAP_TOKEN=one-time-random-secret
```

DeepSeek 推荐配置：

```env
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-v4-flash
```

OpenAI 可选配置：

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5-mini
```

也可以使用通用模型变量：

```env
AI_MODEL=deepseek-v4-flash
```

## 当前前端策略

- 产品列表、新建、详情、删除：优先调用 `/api/products`。
- 产品评分、详情页文案、图片审核：更新后会同步调用 `/api/products/:id`。
- 多语言文案历史：优先调用 `/api/generation-records?kind=copywriting`。
- 多语言文案生成：优先调用 `/api/ai/copywriting`，失败时使用本地 mock。
- 财务利润历史：优先调用 `/api/generation-records?kind=finance`。
- 九宫格评分历史：优先调用 `/api/scoring-records`。
- 竞品对比列表：优先调用 `/api/compare-items`，按账号保存。
- API 不可用或没有 `DATABASE_URL`：自动回退到 localStorage。

## 内部账号初始化

项目默认启用邀请制内部账号。首次上线后：

1. 在 Vercel 环境变量中设置一个临时 `BOOTSTRAP_TOKEN`。
2. 调用 `POST /api/auth/bootstrap` 创建第一个管理员账号，并在请求头里带：

```txt
x-bootstrap-token: 你的 BOOTSTRAP_TOKEN
```

3. 创建成功后，删除 Vercel 中的 `BOOTSTRAP_TOKEN` 并重新部署。
4. 后续管理员可以在设置页创建内部成员账号。

认证相关接口：

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id`

当前账号系统支持：

- 管理员创建内部成员账号。
- 新成员使用临时密码登录后，系统强制要求修改密码。
- 管理员调整角色、启用/停用账号、重置临时密码。
- 用户自行修改密码。
- 登录、改密、账号变更均写入审计日志。

## 后续建议

下一步可以继续把这些模块接入真实服务：

- `/api/ai/image-prompts`
- `/api/ai/image-review`
- `/api/ai/customer-reply`
- `/api/search-products`
- `/api/platform-metrics`
- `/api/logistics/:orderNo`
- `/api/security/status`

接第三方平台前，建议先做登录/租户模型，把每个用户或店铺的数据隔离开。

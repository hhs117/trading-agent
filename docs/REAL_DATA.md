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
- `GET /api/search-products?keyword=xxx&platform=Shopee`
  - 跨平台商品搜索统一入口。默认使用 mock 数据；配置外部搜索服务后可切换到真实结果。
- `GET /api/stores`
  - 读取已配置店铺。
- `POST /api/stores`
  - 新建店铺元数据。
- `GET /api/stores/:id`
  - 读取单个店铺。
- `PATCH /api/stores/:id`
  - 更新店铺信息、启停状态和连接状态。
- `POST /api/sync/products`
  - 批量写入平台商品快照，并记录一次同步任务。
- `POST /api/sync/orders`
  - 批量写入订单快照，并记录一次同步任务。
- `GET /api/store-products?storeId=xxx`
  - 读取某个店铺下已同步的平台商品。
- `GET /api/orders?storeId=xxx`
  - 读取某个店铺下已同步的订单。
- `GET /api/sync-runs?storeId=xxx&entityType=product|order`
  - 查询同步任务历史。
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

商品搜索服务可选配置：

```env
PRODUCT_SEARCH_PROVIDER=mock
PRODUCT_SEARCH_API_URL=
PRODUCT_SEARCH_API_KEY=
RAINFOREST_API_KEY=
RAINFOREST_AMAZON_DOMAIN=amazon.com
```

当 `PRODUCT_SEARCH_PROVIDER=external` 时，系统会请求 `PRODUCT_SEARCH_API_URL`，并把 `keyword`、`platform`、`limit` 作为查询参数传过去。外部服务可以直接返回数组，也可以返回：

```json
{
  "items": [
    {
      "id": "source-123",
      "name": "Portable organizer bag",
      "platform": "TikTok Shop",
      "price": 12.99,
      "monthlySales": 5380,
      "rating": 4.8,
      "reviewCount": 3220,
      "shippingFrom": "Los Angeles, US",
      "sellingPoints": ["large capacity", "waterproof"],
      "competition": "high",
      "estimatedProfitRate": 28,
      "recommendationIndex": 8,
      "keywords": ["organizer", "travel bag"]
    }
  ]
}
```

当 `PRODUCT_SEARCH_PROVIDER=rainforest` 时，系统会直接调用 Rainforest API：

- 目前仅接 Amazon 实时搜索。
- `RAINFOREST_AMAZON_DOMAIN` 默认是 `amazon.com`。
- 会优先返回 Rainforest 搜索结果里的 ASIN、标题、价格、评分、评论数和最近月购字段。
- Amazon 搜索结果本身不提供真实成本，因此利润率会显示为“暂无”，后续需要结合采购价、运费和佣金再计算。

## 当前前端策略

- 产品列表、新建、详情、删除：优先调用 `/api/products`。
- 新建产品时可选择归属店铺，后续真实数据会按店铺维度同步和聚合。
- 平台商品和订单同步结果目前先落库为标准化快照；等店铺授权完成后，只需要补平台取数适配器。
- 产品评分、详情页文案、图片审核：更新后会同步调用 `/api/products/:id`。
- 多语言文案历史：优先调用 `/api/generation-records?kind=copywriting`。
- 多语言文案生成：优先调用 `/api/ai/copywriting`，失败时使用本地 mock。
- 财务利润历史：优先调用 `/api/generation-records?kind=finance`。
- 九宫格评分历史：优先调用 `/api/scoring-records`。
- 竞品对比列表：优先调用 `/api/compare-items`，按账号保存完整商品快照，支持动态搜索结果刷新后继续比较。
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
- `/api/platform-metrics`
- `/api/logistics/:orderNo`
- `/api/security/status`

### 商品同步 payload 示例

```json
{
  "storeId": "store_xxx",
  "source": "api",
  "cursor": "next-page-token",
  "items": [
    {
      "externalProductId": "123456",
      "externalSku": "SKU-001",
      "title": "Portable organizer bag",
      "status": "active",
      "price": 12.99,
      "currency": "USD",
      "stock": 120
    }
  ]
}
```

### 订单同步 payload 示例

```json
{
  "storeId": "store_xxx",
  "source": "api",
  "cursor": "next-page-token",
  "items": [
    {
      "externalOrderId": "ORDER-001",
      "status": "paid",
      "currency": "USD",
      "totalAmount": 29.98,
      "buyerCountry": "US",
      "placedAt": "2026-05-17T09:30:00.000Z"
    }
  ]
}
```

接第三方平台前，建议先做登录/租户模型，把每个用户或店铺的数据隔离开。

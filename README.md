# PawFect Beads-韓式串珠

以 Next.js App Router + TypeScript 建立的手作串珠客製下單網站。

## 專案技術

- Next.js 16（App Router）
- TypeScript
- Tailwind CSS
- React Hook Form + Zod
- Prisma + SQLite
- Nodemailer（SMTP）
- Cloudinary 圖片上傳
- Vitest（基礎測試）

## 環境需求

- Node.js 20+
- npm 10+

## 安裝與啟動

1. 安裝套件

```bash
npm install
```

2. 建立環境變數

```bash
cp .env.example .env
```

3. 設定 `.env` 內容（至少要有 `DATABASE_URL`）

4. 產生 Prisma Client

```bash
npm run prisma:generate
```

5. 建立資料表

```bash
npx prisma migrate deploy
```

如果你的環境要在本機建立第一版資料庫，可使用：

```bash
npx prisma migrate dev --name init
```

6. 匯入固定商品（選用）

```bash
npm run prisma:seed
```

7. 啟動開發伺服器

```bash
npm run dev
```

## 環境變數說明

`.env.example` 已提供完整欄位：

- `DATABASE_URL`: SQLite 連線字串，預設 `file:./dev.db`
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS`
- `MAIL_FROM`: 寄件者顯示名稱與信箱
- `OWNER_EMAIL`: 店家收單信箱
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`
- `CLOUDINARY_UPLOAD_FOLDER`

## 功能摘要

- 首頁品牌展示與 CTA
- 客製下單頁（尺寸、配色、款式、參考圖上傳）
- 單一下單頁（左側客製、右側摘要、Modal 聯絡資訊）
- 下單成功頁（顯示訂單編號）
- 建單後寄送：
  - 店家完整訂單通知信
  - 客戶確認信（若有填 Gmail）
- 寄信失敗會寫入 `EmailLog` 並回傳前端錯誤狀態

## Prisma 資料結構

- `Order`
- `OrderItem`
- `EmailLog`
- `ProductCatalog`（可擴充商品管理）

Schema 位於：`prisma/schema.prisma`  
Migration 位於：`prisma/migrations/20260404223000_init/migration.sql`

## 測試與品質檢查

```bash
npm run lint
npm run typecheck
npm run test
```

## Logo 替換

目前示範 logo 使用 `public/logo.svg`。  
若你有正式品牌 logo，直接覆蓋同路徑檔案，或改成你自己的檔名並同步更新 `app/page.tsx`。

## Admin Backend (New)

- Admin login route: `/admin`
- Default password: `Gr210090` (can override with `ADMIN_PASSWORD`)
- Session cookie signing secret: `ADMIN_SESSION_SECRET`

### Admin pages

- `/admin` login page
- `/admin/dashboard` finance dashboard + order list
- `/admin/products` product CRUD page

### Admin API routes

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/me`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `GET /api/admin/orders`
- `GET /api/admin/finance`

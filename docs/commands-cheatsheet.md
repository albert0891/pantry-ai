# 常用指令備忘錄 (Commands Cheatsheet)

這份文件整理了我們在開發 `pantry-ai` 時常用的終端機指令，如果你忘記了，隨時可以來這裡複製貼上。

## 基礎啟動指令

### 1. 啟動前端與後端 (Next.js + GraphQL)
啟動本機開發伺服器，同時包含前端頁面與 API。
```bash
npm run dev
```
👉 測試 GraphQL (Apollo Sandbox): `http://localhost:3000/api/graphql`
👉 前端頁面: `http://localhost:3000`

## 資料庫相關指令 (Docker & Prisma)

### 1. 啟動本機資料庫容器
使用 Docker 背景啟動 PostgreSQL 資料庫。
```bash
docker-compose up -d
```

### 2. 同步資料表結構 (Push Schema)
當你修改了 `prisma/schema.prisma` 檔案後，需要把新的結構推送到實體資料庫中。
```bash
npx prisma db push
```

### 3. 開啟網頁版資料庫後台
開啟 Prisma Studio 來視覺化查看、修改、刪除資料表內的真實數據。
```bash
npx prisma studio
```
👉 資料庫後台介面: `http://localhost:5555`

## 代理助手擴充技能 (Skills)

### 安裝/更新技能包 (例如 Matt Pocock Skills)
```bash
npx skills@latest add mattpocock/skills
```

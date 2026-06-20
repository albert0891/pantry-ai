# 開發日誌 (Development Log)

這份文件記錄 `pantry-ai` 專案的開發軌跡、核心架構決定以及待辦事項。遵循 Docs as Code 的理念，讓 AI 與開發者都能隨時掌握專案脈絡。

## 專案目標
打造一個「智慧食物儲藏室管理系統」(Pantry Management App)，追蹤食材數量、分類與過期時間。

## 核心技術棧
*   **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
*   **Backend**: GraphQL (Apollo Server)
*   **Database**: PostgreSQL + Prisma ORM
*   **Auth**: AWS Cognito (計畫中)

## 開發階段紀錄

### Phase 1: 基礎架構建立 (已完成)
*   初始化 Next.js 專案
*   設置 Prisma Schema (`User`, `PantryItem`, `Category`)
*   建立 GraphQL Schema 與 Resolvers 骨架

### Phase 2: 資料庫連線與本地環境測試 (進行中)
*   建立 `docker-compose.yml` 運行本地 PostgreSQL
*   執行 Prisma Migration 將 Schema 推送到資料庫
*   在 Apollo Sandbox 測試 GraphQL Queries & Mutations

### Phase 3: 前端 UI 實作 (已完成)
*   首頁：實作 Kanban 看板 (TO_BUY, IN_PANTRY, CONSUMED)
*   實作 Hybrid 列表介面與按鈕轉移功能
*   實作 Client Fetch (Apollo) 與 Optimistic UI 體驗
*   完成響應式設計 (RWD)：實作手機版 Tab 導航切換功能

### Phase 4: 身份驗證整合 (待辦)
*   將 AWS Cognito 整合進前端與 GraphQL Context
*   替換掉目前 Resolvers 中的 `"SYSTEM"` 測試帳號

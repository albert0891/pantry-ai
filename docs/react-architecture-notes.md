# React 架構與設計模式筆記 (React Architecture Notes)

這份筆記整理了在現代 React 專案中（如 Pantry AI）常用的進階架構模式與設計思想。這也是 Senior 前端工程師面試時必備的核心概念。

## 1. 架構概念：元件分類與管理

### Atomic Design (原子設計)
- **核心意義**：將 UI 介面拆解為最基本的、不可再分割的元素。
- **在專案中的實踐**：對應到 `components/ui/` 目錄。
- **特徵**：
  - **Dumb (笨)**：它們沒有任何業務邏輯，不知道「專案是做什麼的」。
  - **高度共用**：例如 `Button`, `Input`, `Dialog`。
  - **純視覺**：只負責接收 props（如文字、顏色、點擊事件）然後渲染出來。

### Domain-Driven Design (領域驅動設計 - DDD) 在前端的應用
- **核心意義**：軟體設計應以系統所在的「核心業務領域」為中心。
- **在專案中的實踐**：對應到 `components/pantry/` 或 `components/features/` 目錄。
- **特徵**：
  - **Smart (聰明)**：與特定的業務邏輯高度綁定。
  - **具備領域知識**：例如 `PantryItemCard` 知道什麼是 `boardState`，也知道如何呼叫 `deletePantryItem` 的 API。
  - **低重用性、高內聚**：通常只在這個特定的專案或模組中能使用，但將這部分的邏輯封裝得很好。

---

## 2. React 開發模式：邏輯與視圖解耦

### Hooks 的核心意義 (Custom Hooks)
- **核心意義**：Hook 是一種用來「封裝與重用 Stateful Logic（具備狀態的邏輯）」的機制。
- **為什麼需要 Custom Hooks？**
  - 當元件變大（如原本 670 行的 `page.tsx`），裡面會充滿大量的 `useState`, `useEffect` 以及 API 呼叫（如 GraphQL 的 `useQuery`）。
  - 將這些邏輯抽離成 `usePantry.ts` 等 Custom Hook，可以讓元件變得非常乾淨，只負責「組合畫面」。
  - **可測試性**：你可以單獨對 `usePantry.ts` 寫單元測試，而不需要把整個龐大的 UI 渲染出來。

### Container / Presenter Pattern (容器與展示模式)
- **核心意義**：將元件嚴格分為「負責獲取資料的容器」和「負責渲染畫面的展示器」。
- **Container (容器元件)**：
  - 負責呼叫 Hooks、與資料庫/API 溝通。
  - 將拿到的資料與操作方法透過 props 傳給 Presenter。
  - 範例：重構後的 `page.tsx` 本身就是一個大型 Container。
- **Presenter (展示元件)**：
  - 不做任何非同步請求，不呼叫 GraphQL。
  - 只接收 props 並將畫面畫出來。
  - 範例：`KanbanBoard` 元件，它只接收 `items` 陣列，並把它們渲染成卡片。

**這個模式帶來的最大好處是：職責單一 (Single Responsibility Principle)，程式碼極度容易維護與擴展。**

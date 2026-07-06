# AI 代理技能與互動指南 (Agent Skills Guide)

這份文件記錄了我們專案中安裝的 AI 擴充技能（Skills），以及你應該如何使用它們來跟我互動，以達到最高效的開發體驗。
**⚠️ 注意：本指南已更新至 Superpower Gen 6 架構。我們淘汰了部分寬鬆的舊版技能，全面導入嚴格的紀律系統。**

## 為什麼需要這些技能？

AI 寫程式很快，但如果沒有嚴謹的架構規劃，專案很快就會變成難以維護的技術債。
我們安裝的技能套件，就是為了強制 AI（也就是我）遵守資深工程師的開發紀律（如 TDD、領域驅動設計、深層除錯等）。

## 🌟 核心互動場景 (Superpower Gen 6 升級版)

### 1. 執行期嚴謹除錯 (Runtime Debugging)

當你遇到一個非常難解、報錯訊息很模糊，或是邏輯發生靈異現象時。

- **呼叫方式**：要求我使用 `systematic-debugging` 技能。
- **AI 的反應**：我會停止盲目猜測與通靈。我會進入最高級別的除錯 SOP：重現問題 -> 縮小範圍 -> 提出假設 -> 驗證。**在找出 Root Cause 之前，我絕對不會寫任何修復代碼**。如果你看到我嘗試修復 3 次都失敗，這個技能會強制我停下來，並質疑你的專案架構是否有根本性的問題。

### 2. 測試驅動開發 (TDD 實作階段)

開發新功能，或修復複雜的核心商業邏輯時。

- **呼叫方式**：要求我使用 `test-driven-development` 技能。
- **AI 的反應**：我會嚴格遵守「紅燈-綠燈-重構」的循環。最重要的是，**沒有先寫出會報錯的自動化測試 (Red)，我絕對不准開始寫實作代碼。**

### 3. 企劃與架構設計 (規劃階段)

實作重大架構改動、跨元件新功能之前。

- **呼叫方式**：要求我使用 `writing-plans` 技能。
- **AI 的反應**：我不會馬上丟一堆 To-Do List 給你。我會先進行「邊界條件 (Edge Case) 掃描」與「架構衝突質疑」。直到確認計畫無懈可擊，才會開始動工。

### 4. 嚴格代碼審查 (Strict Code Review)

完成大功能準備 Merge，想確保沒有留下技術債時。

- **呼叫方式**：要求我使用 `requesting-code-review` 技能。
- **AI 的反應**：我會戴上架構師的帽子，嚴格比對專案 `.agents/AGENTS.md` 裡的自訂規則（例如不可在 Server Action 輸出 Schema 等），有一絲妥協就會退件。

### 5. 節省 Token 與專注模式

當你只需要我給你最核心的答案，不需要寒暄時。

- **指令**：`/caveman [你的問題]`
- **AI 的反應**：省略廢話，直接給出精準的語法，節省 75% 的 Token。

---

## 技能庫總覽 (Skills Directory)

以下是已消化整理的完整技能列表，包含防禦性編譯與其他輔助工具：

### 🛡️ 防禦與架構 (Defense & Architecture)

- **`setup-matt-pocock-skills`**：專注於極端嚴謹的 TypeScript 型別安全與 Zod 驗證。保證只要能過編譯，資料型別就絕對不會出錯。
- **`vercel-react-best-practices`**：Vercel 官方的最佳實踐指南。確保 Next.js / React 開發時，效能、Cache 機制、RSC (React Server Components) 都在最優狀態。
- **`improve-codebase-architecture`**：根據 `CONTEXT.md` 的領域語言與 `docs/adr/` 的架構決策，尋找改善並深化 codebase 架構的機會。

### 🛠️ 工程核心 (Engineering Core - Gen 6)

- **`systematic-debugging`**：[已升級] 取代傳統除錯，強制落實四階段鑑識流程。
- **`test-driven-development`**：[已升級] 取代原 `tdd`，強制紅燈機制。
- **`writing-plans`**：[已升級] 取代原 `request-refactor-plan`，強制邊界條件掃描。
- **`requesting-code-review`**：[已升級] 取代原 `review`，強制架構師級距審查。

### ⚡ 生產力與工作流程 (Productivity)

- **`caveman`**：極度壓縮溝通模式。
- **`grill-me`**：無情拷問模式。針對你的計畫或設計進行嚴厲面試與提問。
- **`handoff`**：交接工作。將當前的長篇對話壓縮總結成一份「交接文件」。
- **`to-issues` / `to-prd`**：將對話或計畫轉換為 Issue Tracker 上的工單或 PRD 文件。
- **`prototype`**：快速建立用過即丟的原型來具現化設計。

### 🧰 Misc (其他與基礎設施)

- **`git-guardrails-claude-code`**：設定 Git 防護欄，防止危險操作 (`push -f`, `reset --hard`)。
- **`setup-pre-commit`**：設定 Husky pre-commit hooks，自動整合 lint-staged, Prettier。

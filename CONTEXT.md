# Domain Context (Glossary)

這份文件定義了 Pantry AI 專案的核心領域術語 (Domain Language)，以確保所有開發者與 AI 助手在溝通時使用精確且一致的詞彙。

## 核心實體 (Core Entities)

*   **PantryItem (庫存物品)**: 系統中追蹤的單一食物或食材。擁有狀態 (`boardState`)、分類 (`category`) 與過期日。
*   **BoardState (看板狀態)**:
    *   `TO_BUY`: 待購清單。
    *   `IN_PANTRY`: 已在儲藏室中的現有庫存。
    *   `CONSUMED`: 已消耗或吃完的物品紀錄。

## AI 食譜系統 (AI Recipe System)

*   **AI Chef (AI 主廚)**: 系統的核心智能功能，負責根據使用者的庫存生成食譜。
*   **Must-Use Ingredient (必用食材)**: 使用者透過在介面上「勾選」所指定的食材。AI 生成食譜時**絕對必須**包含這些食材作為主軸。
*   **Supporting Ingredient (輔助食材)**: 在 `IN_PANTRY` 中未被勾選的其他現有食材。AI 可以「視情況自由搭配」這些食材來完善食譜。
*   **Recipe (食譜)**: AI Chef 根據必用食材與輔助食材所生成的一道料理建議，包含菜名、所需食材列表與簡要烹飪步驟。

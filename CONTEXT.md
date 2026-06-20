# 領域字典 (Domain Context & Ubiquitous Language)

這份文件定義了 `pantry-ai` 專案中使用的核心名詞與業務邏輯。開發過程中的所有溝通與程式碼命名，都必須嚴格遵守此處的定義。

## 核心名詞 (Core Terminology)

*   **PantryItem (食材項目)**：使用者儲藏室內的一項具體實體紀錄。
    *   一個 `PantryItem` 必須包含 `name` (名稱)、`quantity` (數量)、`category` (分類)。
    *   **Expiration (過期日)**：可選填 (`expiryDate`)。如果未填寫，則不具備追蹤功能。
    *   **Status (過期狀態)**：不會存進資料庫。由前端在渲染時動態計算：
        *   系統會根據該物品的 `Category` (分類) 給予固定的提醒天數（例如：生鮮 2 天前提醒，乾貨 14 天前提醒）。
        *   當時間進入提醒區間，狀態變更為 `Expiring Soon`；超過 `expiryDate` 則為 `Expired`。
    *   **BoardState (看板狀態)**：這是一項新增的欄位，代表物品在生命週期中的位置：
        *   `TO_BUY`：在購物清單中。
        *   `IN_PANTRY`：在儲藏室/冰箱中。
        *   `CONSUMED`：已消耗完畢或丟棄。

*   **Category (分類)**：用來將 `PantryItem` 進行歸類的 Enum 標籤（如 PRODUCE 生鮮、DAIRY 乳品）。目前做為 UI 上的視覺標籤與篩選條件，但不強制將畫面切分成過大的獨立區塊。

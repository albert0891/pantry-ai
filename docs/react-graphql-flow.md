# React & GraphQL 的全端資料流筆記

這份筆記解釋了在 `pantry-ai` 專案中，從前端到後端的資料流是如何串接的。當我們在畫面上點擊按鈕新增一筆資料時，它會經過三個主要的關卡。

## 核心名詞解釋

*   **API 的範疇**：在這個架構中，API 不是一個單一檔案，而是由兩個核心檔案組成的組合：
    1.  **`schema.ts` (API 合約)**：定義了有哪些 API 可以呼叫，以及必填參數（前端與後端的談判介面）。
    2.  **`resolvers.ts` (API 實作)**：這個 API 真正的內部運作邏輯（怎麼寫入資料庫）。
    而 `page.tsx` 則是「呼叫 API 的前端消費者」。

*   **Enum (列舉)**：這是一個程式概念，用來定義「一組固定的選項」。就像選擇題只有 A, B, C 可以選一樣。例如 `Category` 這個 Enum 限制了食物分類只能是 `PRODUCE`, `DAIRY`, `MEAT` 或 `OTHER`，如果你傳入 `TOY`，系統就會直接報錯。這能大幅降低資料錯誤的機率。

## 資料流的三部曲

### 第一部曲：Page (前端畫面與動作發起)
`src/app/page.tsx`
*   **用途**：這是使用者看得到的畫面 (Client Component)。它負責畫出 UI，並監聽使用者的點擊行為。
*   **如何運作**：
    我們在這裡使用 Apollo Client 的 `useQuery` 和 `useMutation` hooks。當使用者點擊「新增」按鈕時，`page.tsx` 會發起一個 GraphQL Mutation 請求，並把使用者輸入的字串打包進去。

### 第二部曲：Schema (GraphQL 合約)
`src/graphql/schema.ts`
*   **用途**：這是前端與後端之間的「法律合約」。它嚴格規定了有哪些 API 可以呼叫，以及一定要傳什麼參數。
*   **如何運作**：
    當 `page.tsx` 發送請求過來時，GraphQL 伺服器會先檢查這份合約。如果合約說 `updateItemState(id: ID!, newState: BoardState!)` 規定 `newState` 必須是 `BoardState` Enum 的其中一種，而前端不小心傳了字串 `"HELLO"`，伺服器就會**直接把請求擋下來並報錯**，連後端邏輯都不會進去。
    *(註：Schema 裡面定義的 Mutation 順序完全不重要，它就像字典一樣，沒有順序之分)*

### 第三部曲：Resolver (後端實作邏輯)
`src/graphql/resolvers.ts`
*   **用途**：這是真正的「後端廚房」。當合約 (Schema) 檢查通過後，就會把參數交給這裡處理。
*   **如何運作**：
    這裡面的函式 (Functions) 會負責去跟 Prisma (資料庫 ORM) 溝通。例如它會執行 `prisma.pantryItem.update(...)` 把資料真正寫入 PostgreSQL 資料庫。執行成功後，Resolver 會把最新的資料回傳給前端。前端的 Apollo Client 收到後，就會自動更新畫面。

## 總結流程
1. **Page** 觸發點擊事件，發出 `Mutation` 請求。
2. **Schema** 檢查這個請求是否符合合約規定（參數對不對、型別對不對）。
3. 通過後，交給 **Resolver** 真正去操作資料庫，然後回傳結果給 Page 更新畫面。

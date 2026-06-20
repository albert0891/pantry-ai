# GraphQL 使用筆記

這份文件記錄了在 `pantry-ai` 專案中，我們是如何使用 GraphQL 的，以及一些核心概念，方便未來回顧。

## 為什麼用 GraphQL？
相較於傳統的 RESTful API (每個資源有一個 URL，如 `/api/users`)，GraphQL 只有一個端點 (通常是 `/api/graphql`)。
最大的好處是**「前端要什麼資料，就自己決定」**，不會遇到 RESTful API 常見的 Over-fetching (拿到太多不需要的資料) 或 Under-fetching (資料不夠還要打第二支 API) 的問題。

## 核心概念

### 1. Schema (合約)
Schema 定義了我們有哪些資料結構。在我們的專案中位於 `src/graphql/schema.ts`。
這就像是強型別語言的 Interface，前端和後端都必須遵守這個合約。

### 2. Query (查詢 - 類似 GET)
用來讀取資料。
```graphql
query GetMyPantry {
  myPantryItems {
    id
    name
    quantity
    category
  }
}
```

### 3. Mutation (變更 - 類似 POST/PUT/DELETE)
用來新增、修改、刪除資料。
```graphql
mutation AddItem {
  addPantryItem(name: "蘋果", quantity: 5, category: PRODUCE) {
    id
    name
  }
}
```

### 4. Resolvers (實作)
在 `src/graphql/resolvers.ts` 中，定義了當前端發出 Query 或 Mutation 時，後端實際要去資料庫 (Prisma) 撈資料或寫入資料的邏輯。

> [!NOTE]
> **與 Angular Resolver 的區別**
> 如果你以前寫過 Angular，可能會對 "Resolver" 這個詞感到熟悉又困惑。
> *   **Angular 的 Resolver**：是「前端路由 (Routing)」層級的概念。它會在畫面 (Component) 載入前，先幫你打 API 把資料準備好，避免畫面出現 Loading 閃爍。
> *   **GraphQL 的 Resolver**：是「後端伺服器 (Server)」層級的概念。它是 GraphQL 引擎的指揮官，負責告訴 GraphQL：「當前端跟你要 `myPantryItems` 的時候，請你去 PostgreSQL 資料庫執行這段 SQL 來把資料撈出來」。兩者雖然都叫 Resolver，但一個在前端管路由資料，一個在後端管資料庫撈取。

## 資料庫操作與 GraphQL (API vs DB)
你可能會好奇，剛才用 Mutation 新增了物品，這是在像 Swagger 一樣操作 API，還是真的寫進了資料庫？
答案是：**這是一連串的連鎖反應，你透過 API 真實改動了底層的 PostgreSQL 資料庫**。

流程如下：
1.  **Apollo Sandbox (API 介面)**：你發送了 GraphQL Mutation（這等同於以前用 Postman 或 Swagger 發送 POST 請求）。
2.  **GraphQL Resolver (後端邏輯)**：後端收到請求，執行 `prisma.pantryItem.create(...)`。
3.  **Prisma (ORM / 資料庫操作)**：Prisma 把你的 JavaScript 語法翻譯成了真正的 SQL 語法 (`INSERT INTO "PantryItem" ...`)。
4.  **PostgreSQL (實體資料庫)**：資料被永久存進了硬碟裡。

### 如何查看實體的 Table 資料？
你不需要另外安裝複雜的資料庫圖形介面（例如 DBeaver 或 pgAdmin），Prisma 內建了一個非常漂亮的網頁版資料庫瀏覽器。
只要在終端機輸入：
```bash
npx prisma studio
```
它會自動幫你在瀏覽器開啟 `http://localhost:5555`，這就是一個完整、視覺化的資料庫後台！你可以在這裡面看到剛剛新增的 `PantryItem`，可以直接在表格上修改、刪除資料，就像在使用 Excel 一樣簡單直覺。

## 如何測試 GraphQL？
不需要使用 Swagger！當你在本機端執行 `npm run dev` 時，打開瀏覽器前往：
👉 `http://localhost:3000/api/graphql`
這會開啟 Apollo Sandbox，這是一個超強大的圖形化介面。你可以在左邊看到所有的 Schema 文件，在右邊直接寫 Query 並且按 Play 測試結果。

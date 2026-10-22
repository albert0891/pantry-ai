# Pantry AI 學習資源

## Knowledge

- [React：Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)
  理解為什麼 selectedItemIds 放在 DashboardPage，讓看板與 AIRecipeManager 使用同一份狀態。
- [Next.js：Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
  理解 layout 與互動頁面的邊界；Client Component 不代表完全沒有伺服器預先產生的 HTML。
- [Next.js：Mutating Data](https://nextjs.org/docs/app/getting-started/mutating-data)
  對照 app/actions/ai.ts；從 client 呼叫 server function 仍涉及網路請求。
- [Apollo：Mutations](https://www.apollographql.com/docs/react/data/mutations)
  對照 usePantry 的 refetchQueries，以及 updateItemState 回傳欄位後的 normalized cache 更新。
- [第一課](lessons/0001-follow-one-item.html) / [架構速查](reference/pantry-map.html)
  從移動一顆蘋果追蹤前後端邊界，再練習用自己的話解釋。

## Gaps

- 官方文件為查閱時版本；專案 package.json 指定 Next.js 16.1.6、React 19.2.3。後續講解以專案已使用的 API 為準。
- docs 舊筆記僅供背景參考；部分呼叫位置與現況不同，優先核對 src。

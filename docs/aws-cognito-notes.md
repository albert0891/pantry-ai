# AWS Cognito 身份驗證與資料隔離架構筆記

這份筆記記錄了 Pantry AI 專案如何整合企業級的安全登入系統與資料庫隔離策略。

## 1. 客製化登入畫面 (Custom Auth UI)

我們使用 `shadcn/ui` 實作了三個模式：`SIGN_IN`、`SIGN_UP` 與 `CONFIRM_SIGN_UP`。
每當使用者按下送出時，我們不自行實作 API 驗證，而是直接呼叫 AWS 提供的 SDK：
```tsx
import { signIn, signUp, confirmSignUp } from 'aws-amplify/auth';

// 登入時的邏輯
await signIn({ username: email, password });
await refreshAuth(); // 呼叫 AuthProvider 更新全局狀態
```
**架構意義**：前端擁有 100% 的畫面控制權（不像傳統 Amplify UI 會被綁死樣式），但底層享受 AWS 企業級的密碼加密與驗證機制。

## 2. 路由保護 (Route Guarding)

我們實作了一個全域的 `<AuthProvider>`「守門員」。這個元件包覆了整個 App，並監聽 URL 與登入狀態：
*   **未登入想進入首頁 (`/`)** 👉 強制導向 `/login`。
*   **已登入想進入登入頁 (`/login`)** 👉 強制導向 `/` 首頁。

```tsx
// 路由保護核心邏輯
useEffect(() => {
  if (!isLoading) {
    if (!user && pathname !== '/login') router.push('/login');
    else if (user && pathname === '/login') router.push('/');
  }
}, [user, isLoading, pathname, router]);
```

## 3. JWT 憑證攔截器 (Token Interceptor)

為了解決「後端如何知道發送請求的人是誰」的問題，我們在 Apollo Client 中設定了 `authLink`。
這就像是一個 HTTP Interceptor（攔截器），自動將使用者的登入證明 (JWT) 附帶在每一次的 GraphQL 請求 Header 上：

```typescript
// src/components/providers/ApolloProvider.tsx
const session = await fetchAuthSession();
const token = session.tokens?.idToken?.toString();

// 自動將 Token 放入 HTTP Header
return {
  headers: {
    ...prevContext.headers,
    authorization: token ? `Bearer ${token}` : '',
  }
};
```

## 4. 後端資料隔離 (Data Isolation)

後端 API 收到請求後，安全防護分為兩層：

**第一層：解碼與驗證 (API Route)**
在 `route.ts` 中，使用 `aws-jwt-verify` 解析出卡片主人是誰 (`context.userId`)。這確保了 Token 是由 AWS 簽發且未被竄改的。

**第二層：資料庫層級過濾 (Prisma Resolvers)**
我們在 GraphQL Resolvers 進行嚴格的過濾，確保資料的絕對隔離：
```typescript
// 1. 確認該物品是否屬於這個使用者
const item = await prisma.pantryItem.findUnique({ where: { id: args.id } });
if (item?.userId !== user.id) throw new Error("Forbidden");

// 2. 執行更新或刪除操作
return await prisma.pantryItem.update({...});
```
這保證了 A 使用者永遠無法越權操作或看見 B 使用者的私密資料。

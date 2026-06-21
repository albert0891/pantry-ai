# Tailwind CSS 與 shadcn/ui 的核心概念

## 1. 為什麼業界推崇 Tailwind CSS？(儘管它讓 HTML 變亂)

你一定會覺得：為什麼要在 HTML 裡面寫一堆 `class="flex flex-col p-4 bg-red-500"`？這樣跟以前寫 `style="..."` (Inline styles) 有什麼不一樣？

**業界推崇它的三大核心原因：**
1. **命名地獄的終結**：傳統寫法中，我們常常為了解決命名而頭痛 (`.card-container`, `.card-container-inner`, `.wrapper`)。Tailwind 直接省去了想名字的時間。
2. **不用切換檔案 (No Context Switching)**：傳統開發你需要左邊開 HTML，右邊開 CSS 檔案，兩邊跳來跳去。Tailwind 讓你的視線永遠停留在同一行。
3. **沒有死碼 (Zero Dead Code)**：傳統 CSS 很容易累積一堆再也沒用到的樣式不敢刪除。Tailwind 如果 HTML 刪了，樣式就跟著沒了。而且它編譯後極度小。

## 2. shadcn/ui 與傳統 Bootstrap 的區別？

你問得非常好：「既然 Tailwind 這麼亂，為什麼不乾脆用 Bootstrap？」

*   **Bootstrap 的缺點 (黑盒子)**：Bootstrap 是一包寫死的樣式 (`btn btn-primary`)。如果今天設計師要求按鈕要有特殊的漸層、特殊的圓角，你要覆蓋 Bootstrap 的樣式會非常痛苦（要寫一堆 `!important`）。
*   **shadcn/ui 的優勢 (程式碼擁有權)**：shadcn **不是**一個 npm 安裝包。當你安裝 shadcn 的 `<Button>` 時，它是把 **原始碼** 複製一份到你的專案 (`src/components/ui/button.tsx`) 裡面！
    *   這代表你完全擁有這顆按鈕的控制權。你想加動畫、改邏輯，直接去那個檔案改就好。
    *   在 HTML 裡面，它看起來就像 Bootstrap 一樣乾淨 (`<Button>`)，但底層仍然是 Tailwind，享有 Tailwind 好修改的優勢。

## 3. 什麼是 Radix UI？(shadcn/ui 的最強後盾)

既然 shadcn 只是複製貼上程式碼，那為什麼它裡面的 Dialog (彈出視窗)、Select (下拉選單) 能夠運作得這麼完美，甚至沒有 Bug 呢？這都要歸功於 **Radix UI**。

*   **無樣式元件 (Unstyled Components)**：Radix UI 是一個非常特別的函式庫，它專門提供「沒有任何外觀」的 React 元件。
*   **專注於行為與無障礙 (A11y)**：雖然它沒有長相，但它完美解決了所有複雜的「行為」。例如：點擊彈窗外面會關閉、按下 ESC 會關閉、使用 Tab 鍵切換時焦點不會跑出彈窗外、支援螢幕閱讀器等。
*   **shadcn/ui 的運作原理**：shadcn 其實就是「**Radix UI (負責行為) + Tailwind CSS (負責外觀)**」的完美結合體。當你使用 `npx shadcn add dialog` 時，它底層安裝了 Radix UI 的邏輯引擎，並套上了漂亮的 Tailwind 衣服給你！

## 4. React Component 的命名慣例 (Naming Convention)

沒錯，你觀察到了！
在 React 的世界裡，**只要是你自己寫的「元件 (Component)」或是別人寫好的元件，開頭一定要是大寫 (PascalCase)**。

*   **小寫開頭** (`<div>`, `<button>`)：代表這是瀏覽器原生的普通 HTML 標籤。
*   **大寫開頭** (`<Card>`, `<Button>`, `<Header>`)：代表這是一個「React 元件」，裡面封裝了複雜的邏輯與樣式。這是 React 官方硬性規定的防呆機制。

# Design

## Theme

溫暖、有機的奶油色調 (Cream / Sand / Warm White)，取代冰冷的純白色與科技感，給人溫暖家用廚房的氛圍。

## Typography

- **Heading**: Quicksand (圓潤、親切，帶有家用與有機感)
- **Body**: Noto Sans TC (高可讀性，清晰乾淨)
- **Rule**: 嚴格控制陰影與層次。標題不該有廉價的漸層色 (Gradient text) 或發光效果。

## Colors (OKLCH 邏輯)

- **Background**: 暖白色 (如 `bg-stone-50` 或帶有一點暖橘的 `bg-orange-50/30`)
- **Surface**: `bg-white` (乾淨無毛玻璃效果的純色卡片)
- **Ink / Text**: `text-stone-800` 或 `text-stone-900` (取代 `text-slate-800`，帶來更溫暖的對比)。絕不使用灰字配彩色背景 (Gray-on-color)。
- **Accent**: 溫暖的大地色或食物色 (如深橘色、紅陶色 Terracotta、羅勒綠)，用來標示主要的 CTA (如 AI 抽卡按鈕)。

## Components

- **卡片 (Cards)**:
  - 只有單一色塊背景與細緻的單色邊界 (1px border)，絕對不使用玻璃擬物化 (Glassmorphism)。
  - 內邊距 (Padding) 充足，保留呼吸空間。
  - 行動裝置優先，確保排版在小螢幕時不會互相擠壓 (避免內容溢出)。
- **按鈕 (Buttons)**:
  - 實色或極簡線框。
  - Hover 效果以顏色加深為主，嚴禁過度誇張的微動畫 (如整個按鈕放大、圖示旋轉、Pulsing 等)。

## Mobile Adaptability

- 介面必須在手機螢幕上易於單手點擊 (按鈕至少 44x44px)。
- 列表與卡片佈局在窄螢幕上應維持清晰層級，不應有橫向捲軸 (除非是刻意的輪播)。

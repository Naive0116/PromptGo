# GitHub Copilot Instructions for Prompt Packs

## 專案概述

這是一個 **Prompt Packs** 專案，用於展示和管理來自 OpenAI Academy 的各種 ChatGPT 提示包。專案包含爬蟲、資料處理和前端展示三個主要部分。

### 技術棧
- **前端**: React 18 + TypeScript + Vite
- **路由**: React Router v7 (HashRouter 模式，支援 GitHub Pages)
- **樣式**: CSS + CSS Variables (Design Tokens)
- **爬蟲**: Playwright + Node.js
- **多語系**: 自訂 Context-based i18n (en, zh-TW)

---

## 專案結構

```
prompt-packs/
├── crawler/              # 爬蟲相關
│   ├── crawl-openai-academy.mjs
│   └── out_zh/          # 繁中爬蟲輸出
├── scripts/
│   └── sync-data.mjs    # 同步資料到 public/data
├── public/data/         # 前端資料來源
│   ├── en/             # 英文版
│   └── zh-TW/          # 繁體中文版
└── src/
    ├── pages/          # Home, Category, Teaching
    ├── components/     # CopyButton, LanguageSwitcher, Toolbar 等
    ├── i18n/           # 多語系
    ├── lib/            # 工具函式
    └── styles/         # 全域樣式和 tokens
```

---

## 開發規範

### 1. 程式碼風格

#### TypeScript/React
- 使用 **函式元件 + Hooks**，避免 class components
- 使用 **React.FC** 型別定義元件
- Props 介面命名：`[ComponentName]Props`
- 使用 **解構賦值** 取得 props 和 hook 值
- 優先使用 **const** 而非 let

```tsx
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
}

const Button: React.FC<ButtonProps> = ({ label, onClick }) => {
  return <button onClick={onClick}>{label}</button>;
};
```

#### CSS
- 使用 **CSS Variables** (定義在 `tokens.css`)
- 遵循 **BEM 命名** 或 **語意化 class 名稱**
- RWD 斷點：`@media (max-width: 768px)` 為手機版
- 避免 inline styles，除非動態計算

```css
/* ✅ Good: 使用 CSS Variables */
.card {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-lg);
  background: var(--color-surface);
}
```

### 2. 多語系 (i18n)

- 所有使用者可見文字必須透過 `t()` 函式
- 新增文字時，同步更新 `messages.en.json` 和 `messages.zh-TW.json`
- key 命名使用 camelCase：`copyUseCase`, `chromeExtension`

```tsx
// ✅ Good
const { t } = useLang();
<button>{t('copy')}</button>

// ❌ Bad: 直接寫死文字
<button>複製</button>
```

### 3. 路由

- 使用 **HashRouter** (支援 GitHub Pages 靜態部署)
- 路由定義在 `router.tsx`
- 主要路由：
  - `/` - 首頁 (Home)
  - `/c/:key` - 分類詳情 (Category)
  - `/teaching` - 教學頁 (Teaching)

### 4. 資料讀取

- 所有資料從 `public/data/{lang}/` 讀取
- 使用 `fetchData()` 函式 (定義在 `lib/data.ts`)
- 資料結構：
  - `prompt.json` - 所有分類索引
  - `{key}.json` - 特定分類的詳細內容

```tsx
// ✅ Good
const data = await fetchData<CategoryDoc>('category', lang, key);
```

### 5. 元件設計原則

#### CopyButton
- 顯示圖示 + 標籤（如「用例」、「提示」）
- 不顯示「複製」或「Copy」字樣
- 已複製時顯示 ✓ 圖示
- 字體大小：icon `1em`, label `0.7rem`

#### LanguageSwitcher
- 不使用國旗 emoji
- 只顯示文字：「English」、「繁體中文」
- 使用自訂按鈕組，非原生 select

#### Toolbar
- 標題 + 項目計數 + 下載按鈕
- 項目計數顯示在標題旁（如：`ChatGPT 給人資 24`）

### 6. RWD 與手機版

#### 手機版 Header (< 768px)
- Chrome 擴充按鈕：第一行 100% 寬度
- 「如何使用」按鈕 + 語言切換器：並排第二行，各佔 50%
- 使用 `flex-wrap: wrap`

```css
@media (max-width: 768px) {
  .header-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .chrome-extension-link {
    flex: 1 1 100%;
  }
  
  .header-actions > a:nth-child(2),
  .language-switcher {
    flex: 1 1 calc(50% - var(--spacing-xs) / 2);
  }
}
```

#### 卡片佈局
- 桌面版：3 欄 grid (`repeat(auto-fill, minmax(300px, 1fr))`)
- 手機版：1 欄

---

## 常用指令

```bash
# 開發
npm run dev          # 啟動開發伺服器

# 建置
npm run build        # TypeScript 編譯 + Vite 建置
npm run preview      # 預覽建置結果

# 爬蟲與資料
npm run crawl        # 執行爬蟲
npm run sync:data    # 同步資料到 public/data
npm run all          # 爬蟲 → 同步 → 開發伺服器
```

---

## 設計原則

### 顏色系統 (Design Tokens)
- 使用 CSS Variables 定義在 `tokens.css`
- 主色：紫色漸層 (`--gradient-primary`)
- 背景：深藍色 (`--color-background: #0f172a`)
- 卡片：半透明 (`--color-surface: rgba(30, 41, 59, 0.8)`)
- 文字：白色/灰色層次 (`--color-text`, `--color-text-secondary`)

### 動畫與互動
- 按鈕：hover 時 transform + 陰影變化
- 卡片：進場動畫 `fadeInUp`，使用 `animation-delay` 錯開
- 複製按鈕：已複製時 `scale(1.05)` + 綠色背景

### 無障礙 (a11y)
- 所有按鈕提供 `aria-label`
- 複製按鈕使用 `aria-live="polite"`
- 語意化 HTML 標籤 (`<header>`, `<main>`, `<nav>`)

---

## 特殊注意事項

### 1. Teaching Page 影片切換
- 根據語言動態切換 YouTube 影片 ID
- 定義 `videoIds` 物件存放不同語言的影片 ID

```tsx
const videoIds = {
  'zh-TW': 'video_id_zh',
  'en': 'video_id_en'
};
const youtubeVideoId = videoIds[lang as keyof typeof videoIds];
```

### 2. HTML Title 動態更新
- 在 `App.tsx` 使用 `useEffect` 更新 `document.title`
- 根據當前語言顯示「提示包」或「Prompt Packs」

### 3. 首頁標題
- 不顯示「分類」二字
- 直接顯示卡片網格

### 4. 複製按鈕 Label
- 使用 i18n keys: `useCase`, `prompt`, `superPrompt`
- 不使用 `copyUseCase`, `copyPrompt` (避免「複製」字樣)

---

## 除錯技巧

### 常見問題

#### 1. 路由刷新後 404
- 確認使用 `createHashRouter` 而非 `createBrowserRouter`
- GitHub Pages 需要 Hash 模式

#### 2. 資料讀取失敗
- 檢查 `public/data/{lang}/{key}.json` 是否存在
- 確認 `sync:data` 腳本已執行

#### 3. 樣式不生效
- 檢查 CSS Variables 是否正確引用
- 確認 `@import './tokens.css'` 在 `global.css` 最上方

#### 4. 多語系文字未顯示
- 確認 `messages.{lang}.json` 有對應 key
- 檢查 `useLang()` hook 是否在 `LangProvider` 內部使用

---

## 程式碼範例

### 新增元件

```tsx
// src/components/NewComponent.tsx
import React from 'react';
import { useLang } from '../i18n';

interface NewComponentProps {
  title: string;
}

const NewComponent: React.FC<NewComponentProps> = ({ title }) => {
  const { t } = useLang();
  
  return (
    <div className="new-component">
      <h2>{title}</h2>
      <p>{t('description')}</p>
    </div>
  );
};

export default NewComponent;
```

### 新增樣式

```css
/* src/styles/global.css */
.new-component {
  padding: var(--spacing-md);
  background: var(--color-surface);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
}

@media (max-width: 768px) {
  .new-component {
    padding: var(--spacing-sm);
  }
}
```

### 新增 i18n 文字

```json
// src/i18n/messages.zh-TW.json
{
  "description": "這是描述文字"
}

// src/i18n/messages.en.json
{
  "description": "This is a description"
}
```

---

## Git 工作流程

- 主分支：`main`
- 提交訊息使用中文或英文，清楚描述變更
- 範例：
  - `feat: 新增複製按鈕元件`
  - `fix: 修正手機版 header 排版`
  - `style: 調整卡片間距`
  - `docs: 更新 README`

---

## 部署

### GitHub Pages
1. 執行 `npm run build`
2. 執行 `npm run deploy` (需安裝 `gh-pages` 套件)

### 注意事項
- 使用 HashRouter 避免 404 問題
- `vite.config.ts` 設定正確的 `base` 路徑

---

## 聯絡與貢獻

如有問題或建議，請開 Issue 或 Pull Request。

---

**最後更新：2025-10-06**

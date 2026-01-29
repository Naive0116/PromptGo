```
PROMPT-PACKS/
├─ crawler/                         # 爬蟲區
│  ├─ crawl-openai-academy.mjs      # 爬蟲主程式
│  └─ out_zh/                       # 繁中原始輸出（來源）
│     ├─ prompt.json                # 所有分類索引
│     ├─ ChatGPT_for_any_role.json
│     ├─ ChatGPT_for_customer_success.json
│     ├─ ChatGPT_for_engineers.json
│     ├─ ChatGPT_for_executives.json
│     ├─ ChatGPT_for_finance.json
│     ├─ ChatGPT_for_HR.json
│     ├─ ChatGPT_for_IT.json
│     ├─ ChatGPT_for_managers.json
│     ├─ ChatGPT_for_marketing.json
│     ├─ ChatGPT_for_product.json
│     └─ ChatGPT_for_sales.json
│
├─ scripts/                         # 自動化腳本（轉檔/驗證/索引）
│  └─ sync-data.mjs                 # ★ 將 crawler 輸出轉到 public/data/{lang}
│
│
├─ public/                          # 靜態資源
│  ├─ vite.svg                      # 預設 favicon
│  └─ data/                         # ★ 前端唯一讀取的資料來源
│     ├─ _report.json               # 資料同步報告
│     ├─ en/                        # 英文版資料
│     │  ├─ prompt.json
│     │  ├─ ChatGPT_for_any_role.json
│     │  ├─ ChatGPT_for_customer_success.json
│     │  ├─ ChatGPT_for_engineers.json
│     │  ├─ ChatGPT_for_executives.json
│     │  ├─ ChatGPT_for_finance.json
│     │  ├─ ChatGPT_for_HR.json
│     │  ├─ ChatGPT_for_IT.json
│     │  ├─ ChatGPT_for_managers.json
│     │  ├─ ChatGPT_for_marketing.json
│     │  ├─ ChatGPT_for_product.json
│     │  └─ ChatGPT_for_sales.json
│     └─ zh-TW/                     # 繁體中文版資料
│        ├─ prompt.json
│        ├─ ChatGPT_for_any_role.json
│        ├─ ChatGPT_for_customer_success.json
│        ├─ ChatGPT_for_engineers.json
│        ├─ ChatGPT_for_executives.json
│        ├─ ChatGPT_for_finance.json
│        ├─ ChatGPT_for_HR.json
│        ├─ ChatGPT_for_IT.json
│        ├─ ChatGPT_for_managers.json
│        ├─ ChatGPT_for_marketing.json
│        ├─ ChatGPT_for_product.json
│        └─ ChatGPT_for_sales.json
│
├─ src/                             # 前端原始碼（Vite + React + TypeScript）
│  ├─ main.tsx                      # 應用程式入口
│  ├─ App.tsx                       # 根元件（Layout：Header/語系切換/Outlet）
│  ├─ router.tsx                    # 路由定義（使用 HashRouter 支援 GitHub Pages）
│  ├─ vite-env.d.ts                 # Vite 類型定義
│  ├─ pages/
│  │  ├─ Home.tsx                   # 首頁：列出所有分類（讀 data/{lang}/prompt.json）
│  │  ├─ Category.tsx               # 分類頁：顯示某分類 items；複製/下載（讀 data/{lang}/{key}.json）
│  │  └─ Teaching.tsx               # 教學頁：如何使用 prompt（含中英文影片切換）
│  ├─ components/
│  │  ├─ CopyButton.tsx             # 複製按鈕（圖示+標籤，含 aria-live）
│  │  ├─ DownloadMenu.tsx           # 下載 JSON 按鈕
│  │  ├─ LanguageSwitcher.tsx       # 語言切換器（English / 繁體中文）
│  │  ├─ TagChip.tsx                # 標籤元件
│  │  └─ Toolbar.tsx                # 工具列（標題 + 計數 + 下載按鈕）
│  ├─ i18n/
│  │  ├─ index.tsx                  # 多語系邏輯：LangContext、useLang、t()
│  │  ├─ messages.en.json           # 英文翻譯
│  │  └─ messages.zh-TW.json        # 繁體中文翻譯
│  ├─ lib/
│  │  └─ data.ts                    # 資料讀取：fetchData、resolveDataPath
│  ├─ styles/
│  │  ├─ tokens.css                 # 設計 token（顏色/陰影/間距）
│  │  └─ global.css                 # 全域樣式、RWD、深色主題
│  └─ assets/
│     └─ react.svg                  # React logo
│
├─ index.html                       # HTML 入口
├─ package.json                     # 專案設定與依賴
├─ package-lock.json                # 鎖定版本
├─ tsconfig.json                    # TypeScript 設定
├─ tsconfig.node.json               # Node TypeScript 設定
├─ vite.config.ts                   # Vite 設定
├─ .gitignore                       # Git 忽略清單
└─ README.md                        # 專案說明
```

# 爬蟲指令說明 (AI 用)

## 目的
本文檔提供 `crawl-openai-academy.mjs` 爬蟲腳本的完整說明。主要設計給 AI 代理理解並執行 OpenAI Academy Prompt Packs 資料的爬取任務。

## 腳本概述
- **檔案**: `crawler/crawl-openai-academy.mjs`
- **語言**: Node.js ES Modules
- **用途**: 從 OpenAI Academy 網站爬取 Prompt Packs 資料
- **技術**: 使用 Playwright 進行瀏覽器自動化
- **輸出**: 包含扁平化提示資料結構的 JSON 文件

## 系統需求
- Node.js >= 18.0.0
- Playwright 配合 Chromium 瀏覽器
- 依賴套件: `fs-extra`, `playwright`

## 安裝指令
```bash
# 安裝專案依賴
npm install

# 安裝 Playwright 瀏覽器
npm run prepare
```

## 執行方式

### 主要執行
```bash
# 從專案根目錄執行
npm run crawl
```

### 直接腳本執行
```bash
# 基本執行
node crawler/crawl-openai-academy.mjs

# 帶有自訂參數
node crawler/crawl-openai-academy.mjs --tag <url> --out <dir> --debug 1
```

## 命令列參數

| 參數 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `--tag` | string | OpenAI Academy Prompt Packs URL | 要爬取的標籤頁面 URL |
| `--single` | string | 空 | 單一資源頁面 URL（覆蓋標籤模式） |
| `--out` | string | `./crawler/out` | 輸出目錄路徑 |
| `--delayMs` | number | 350 | 頁面請求間延遲毫秒數 |
| `--headless` | boolean | true | 以無頭模式運行瀏覽器 |
| `--requiredTags` | string | "WORK USERS,PROMPT PACKS" | 逗號分隔的必需標籤 |
| `--debug` | boolean | false | 啟用除錯日誌 |

## 執行模式

### 標籤模式 (預設)
- 爬取標籤頁面以發現資源
- 依標題模式和標籤過濾資源
- 處理每個有效資源頁面
- 生成完整資料集

### 單頁模式
- 使用 `--single <url>` 參數
- 僅處理一個特定資源頁面
- 適用於測試或目標提取

## 資料處理流程

### 1. 參數解析
```javascript
// 腳本解析 --key=value 或 --key value 格式
const args = parseArgs(process.argv.slice(2));
const CFG = {
  tagUrl: args.tag || DEFAULT_TAG_URL,
  singleUrl: args.single || '',
  outDir: args.out || './crawler/out',
  // ... 其他配置
};
```

### 2. 瀏覽器初始化
- 透過 Playwright 啟動 Chromium
- 設定自訂 User-Agent
- 配置無頭模式

### 3. 頁面發現 (標籤模式)
- 導航至標籤 URL
- 自動捲動以載入動態內容
- 提取資源卡片連結
- 依標題模式過濾: `/^ChatGPT for /i`
- 依必需標籤過濾: WORK USERS, PROMPT PACKS

### 4. 內容提取
對於每個目標頁面:
- 使用 DOM 渲染載入頁面
- 自動捲動確保內容載入
- 解析包含表格的 H2 區段
- 提取表格資料: use_case, prompt, chatgpt_url
- 生成帶有欄位佔位符的 superPrompt

### 5. 資料轉換
```javascript
// 將 [placeholder] 轉換為 {{ fieldN || placeholder }}
function makeSuperPrompt(promptText) {
  let n = 1;
  return promptText.replace(/\[([^\]]+)\]/g, (_m, label) => {
    return `{{ field${n++} || ${label.trim()}}}`;
  });
}

// 將區段扁平化為 items 陣列
function toFlatDoc(doc, tags) {
  const items = doc.sections.flatMap(section =>
    section.items.map(item => ({
      use_case: item.use_case,
      prompt: item.prompt,
      superPrompt: makeSuperPrompt(item.prompt),
      chatgpt_url: item.chatgpt_url
    }))
  );
  return { title: doc.title, page_url: doc.page_url, tags, items };
}
```

### 6. 輸出生成
- `prompt.json`: 所有分類的索引
- `{category_key}.json`: 每個分類的詳細資料
- JSON 格式，2 空格縮排

## 輸出目錄結構

### 預設輸出: `crawler/out/`
- 包含英文語言資料
- 由預設執行生成

### 中文輸出: `crawler/out_zh/`
- 包含繁體中文翻譯
- 手動維護或單獨生成

### 自訂輸出
- 使用 `--out <directory>` 參數
- 目錄自動建立（若不存在）

## 輸出檔案格式

### prompt.json 結構
```json
{
  "category_key": {
    "title": "分類標題",
    "page_url": "https://academy.openai.com/...",
    "tags": ["WORK USERS", "PROMPT PACKS"]
  }
}
```

### {category_key}.json 結構
```json
{
  "title": "分類標題",
  "page_url": "https://academy.openai.com/...",
  "tags": ["WORK USERS", "PROMPT PACKS"],
  "items": [
    {
      "use_case": "使用案例描述",
      "prompt": "原始提示文字",
      "superPrompt": "帶有 {{ field1 || placeholder }} 的提示",
      "chatgpt_url": "https://chat.openai.com/..."
    }
  ],
  "scraped_at": "2025-10-07T12:00:00.000Z"
}
```

## 錯誤處理
- 個別頁面失敗記錄為警告
- 腳本繼續處理剩餘頁面
- 網路超時: 初始載入 60 秒，選擇器等待 30 秒
- 未實作自動重試；需要手動重新執行

## 效能考量
- 預設延遲: 請求間 350 毫秒
- 自動捲動: 內容載入 24 步 × 120 毫秒
- 頁面等待: 動態內容 1200 毫秒
- 增加 `--delayMs` 以避免速率限制

## 除錯模式功能
- `--debug 1`: 啟用詳細日誌
- 顯示過濾卡片數量和 URL
- 顯示每個頁面的處理狀態
- 記錄解析失敗

## 維護注意事項
- OpenAI Academy URL 結構變更時更新 `CFG.tagUrl`
- 監控解析邏輯中的 DOM 結構變更
- 依網站更新調整必需標籤
- 應定期更新 User-Agent 字串

## 故障排除指令
```bash
# 清除輸出目錄
npm run clean

# 測試單頁解析
node crawler/crawl-openai-academy.mjs --single <url> --debug 1

# 手動安裝 Playwright 瀏覽器
npx playwright install chromium

# 檢查 Node.js 版本
node --version
```

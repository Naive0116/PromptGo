# 翻譯 Prompt Pack JSON 文件

## 任務描述

將 `./crawler/out/` 資料夾中的 JSON 文件翻譯成中文版本，並儲存到 `./crawler/out_zh/` 資料夾中。總共有 n 個 JSON 文件需要處理。

## 文件分類

- `prompt.json`: 翻譯 `title` 字段
- `ChatGPT_for_xxx.json`: 翻譯 `use_case`、`prompt`、`superPrompt` 字段

## 翻譯規則

- 使用台灣繁體中文用語
- 特別注意 `[xxx]` 內的變數也要翻譯，例如 `[insert]` 改為 `[插入]`
- 特別注意 `{{ fieldN || xxx }}` 內的變數也要翻譯，例如 `{{ field1 || apple }}` 改為 `{{ 欄位一 || 蘋果 }}`
- 保持 `chatgpt_url` 等其他字段不變

## 步驟

1. 檢查 `out/` 和 `out_zh/` 的文件數量是否匹配（應為 n 個）
2. 逐一讀取 `out/` 中的文件
3. 翻譯指定字段
4. 將翻譯後的內容寫入 `out_zh/` 中對應的文件

## 範例

- 英文: "Write a professional email"
- 中文: "撰寫專業電子郵件"

- 英文: "The email is about [topic]"
- 中文: "這封郵件是關於 [主題]"

- 英文: "The email is about {{ field1 || topic }}"
- 中文: "這封郵件是關於 {{ 欄位一 || 主題 }}"

## 注意事項

- 確保 JSON 格式正確
- 保留原始結構和未翻譯字段
- 使用一致的翻譯風格

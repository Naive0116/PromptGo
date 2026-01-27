# PromptGo 普提狗 🐕

> AI 时代的精神助产术 —— 未经审视的 Prompt 是不值得发送的

通过苏格拉底式产婆术对话，将模糊想法"接生"为结构化、可测试、可迭代的高质量 AI 提示词。

## ✨ 功能特点

- **🧠 苏格拉底式引导**：通过 3-5 轮智能提问，帮助你理清思路
- **📋 多框架支持**：Standard / LangGPT / CO-STAR / XML 结构化
- **📄 RAG 文件上传**：支持 PDF、Word、图片 OCR，学习专业术语
- **🎨 苹果风格 UI**：现代化设计，流畅交互体验
- **🔒 指令层级安全**：内置注入防护和质量标准
- **🤖 多模型支持**：Anthropic Claude、OpenAI、DeepSeek、通义千问等

## 📁 项目结构

```
prompt-forge/
├── frontend/          # React + TypeScript 前端
├── backend/           # FastAPI Python 后端
├── docs/              # 文档（RAG 语料库索引）
└── README.md
```

---

## 🚀 快速开始

### 前置要求

- **Node.js** 18+（含 npm）
- **Python** 3.10+
- **API Key**（Anthropic / OpenAI / 通义千问 等）

---

### Windows 快速开始

#### 1. 安装前置依赖

1. **安装 Node.js**：下载 https://nodejs.org/ LTS 版本，安装时勾选"Add to PATH"
2. **安装 Python**：下载 https://www.python.org/downloads/ ，安装时勾选"Add Python to PATH"

#### 2. 后端设置

```powershell
cd backend

# 创建虚拟环境
python -m venv venv
venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
copy .env.example .env
# 用记事本编辑 .env 文件，填入你的 API Key

# 启动服务
uvicorn app.main:app --reload --port 8000
```

#### 3. 前端设置（新开一个终端）

```powershell
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

#### 4. 访问应用

打开浏览器访问 http://localhost:5173

---

### macOS / Linux 快速开始

#### 1. 安装前置依赖

**macOS**：
```bash
# 推荐直接下载 Node.js 官方安装包：https://nodejs.org/
# 或使用 Homebrew
brew install node python@3.12
```

**Linux (Ubuntu/Debian)**：
```bash
sudo apt update
sudo apt install nodejs npm python3 python3-venv python3-pip
```

#### 2. 后端设置

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 API Key

# 启动服务
uvicorn app.main:app --reload --port 8000
```

#### 3. 前端设置（新开一个终端）

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

#### 4. 访问应用

打开浏览器访问 http://localhost:5173

---

## ⚙️ 环境变量配置

在 `backend/.env` 文件中配置：

```env
# LLM Provider: anthropic, openai, deepseek, qwen, custom
LLM_PROVIDER=anthropic

# API Key（根据你选择的 Provider 填写对应的 Key）
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
DASHSCOPE_API_KEY=your-qwen-key

# Model name
LLM_MODEL=claude-sonnet-4-5-20250929

# 自定义 API 地址（可选，用于代理或私有部署）
# LLM_BASE_URL=https://your-proxy.com/v1
```

### 支持的 LLM Provider

| Provider | 模型示例 | API Key 环境变量 |
|----------|----------|------------------|
| `anthropic` | claude-sonnet-4-5-20250929 | `ANTHROPIC_API_KEY` |
| `openai` | gpt-4o, gpt-4-turbo | `OPENAI_API_KEY` |
| `deepseek` | deepseek-chat | `DEEPSEEK_API_KEY` |
| `qwen` | qwen-max, qwen-plus | `DASHSCOPE_API_KEY` |
| `custom` | 任意 OpenAI 兼容 API | 在前端设置中配置 |

---

## 📖 API 文档

启动后端后，访问 http://localhost:8000/docs 查看 Swagger API 文档。

---

## 🛠️ 技术栈

### 前端
- React 18 + TypeScript
- Tailwind CSS（苹果风格设计系统）
- Vite

### 后端
- FastAPI
- SQLite + SQLAlchemy
- 多 LLM Provider 抽象层
- 文档解析（PyMuPDF + python-docx + 多模态 OCR）

---

## 📝 更新日志

### v1.2 (2026-01-27)
- 🎨 品牌升级：PromptGo 普提狗
- 🍎 苹果风格 UI 重设计
- 🧠 元提示词 v2.0（PromptSpec + 指令层级安全）
- 📋 框架选择器卡片式展示
- 📄 RAG 文件上传（PDF/Word/图片 OCR）
- 🐛 输入法回车键兼容修复

### v1.1 (2026-01-27)
- 已保存提示词可交互
- 输入框支持换行
- 设置页适配代理厂商
- 换个思路按钮
- 细化流程支持

---

## 📄 License

MIT

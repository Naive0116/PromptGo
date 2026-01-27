# PromptForge - 苏格拉底提示词工坊

通过苏格拉底式对话，将模糊想法逐步提炼为精准、高质量的AI提示词。

## 功能特点

- **苏格拉底式引导**：通过3-5轮智能提问，帮助你理清思路
- **LLM自适应**：根据不同任务动态生成最相关的引导问题
- **实时预览**：边对话边看提示词演进过程
- **多模型支持**：支持 Anthropic Claude、DeepSeek、通义千问等

## 项目结构

```
prompt-forge/
├── frontend/          # React + TypeScript 前端
├── backend/           # FastAPI Python 后端
└── README.md
```

## 快速开始

### macOS 前置要求（重要）

本项目包含 `frontend`（需要 Node.js + npm）和 `backend`（需要 Python 3）。

如果你的机器上 `npm`/`brew` 不存在：

- **推荐**：直接安装 Node.js 官方 LTS 安装包（自带 `node`/`npm`）：https://nodejs.org/
- **Homebrew 方式**：需要管理员（`sudo`）权限先安装 Homebrew，再用 `brew install node`

### 1. 后端设置

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 API Key

# 启动服务
uvicorn app.main:app --reload --port 8000
```

### 2. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

如果你在 macOS 上执行 `npm install` 提示 `npm: command not found`，说明尚未安装 Node.js（见上面的“macOS 前置要求”）。

### 3. 访问应用

打开浏览器访问 http://localhost:5173

## 环境变量配置

在 `backend/.env` 文件中配置：

```env
# Anthropic API Key
ANTHROPIC_API_KEY=your-api-key-here

# LLM Provider: anthropic, deepseek, qwen
LLM_PROVIDER=anthropic

# Model name
LLM_MODEL=claude-sonnet-4-5-20250929
```

## API 文档

启动后端后，访问 http://localhost:8000/docs 查看 Swagger API 文档。

## 技术栈

### 前端
- React 18
- TypeScript
- Tailwind CSS
- Vite

### 后端
- FastAPI
- SQLite + SQLAlchemy
- Anthropic Python SDK

## License

MIT

# 元提示词深度分析报告 - 颠覆性优化策略

## 一、语料库分析概述

通过深入分析 `corpus_cache3` 中来自 **Anthropic (Claude)**、**OpenAI (GPT-5/o3)**、**Google (Gemini)** 以及其他产品的顶级系统提示词，我们发现了以下关键模式和最佳实践。

---

## 二、核心洞察

### 2.1 结构化分层架构

所有顶级 AI 系统都采用**多层模块化架构**：

| 层级 | Claude | GPT-5 | Gemini | 作用 |
|------|--------|-------|--------|------|
| 身份层 | `<behavior_instructions>` | Persona 段落 | Personality & Core Principles | 定义 AI 身份和核心价值观 |
| 工具层 | `<tool_calling_spec>` | Tools Namespace | Tool Usage Rules | 工具使用规范和决策边界 |
| 格式层 | `<tone_and_formatting>` | Writing Style | Default Response Style | 输出格式和风格指南 |
| 安全层 | `<refusal_handling>` | Safety Notes | Safety Guidelines | 安全边界和拒绝策略 |
| 上下文层 | Memory System | Advanced Memory | Current time/location | 持久化记忆和上下文管理 |

### 2.2 关键技术模式

#### A. 决策边界明确化 (Decision Boundaries)
```
<situations_where_you_must_use_X>
...具体触发条件...
</situations_where_you_must_use_X>

<situations_where_you_must_not_use_X>
...排除条件...
</situations_where_you_must_not_use_X>
```

#### B. 负面示例与正面示例对比
```
**Good Response:** Hi [name]! How can I help you today?
**Bad Response:** Based on my memories, I see that your name is [name]...
```

#### C. 冗余度控制 (Oververbosity)
```
# Desired oververbosity for the final answer: 2
An oververbosity of 1 = minimal content
An oververbosity of 10 = maximally detailed
```

#### D. 技能文件系统 (Skills)
```
Claude's first order of business should always be to think about 
the skills available and decide which skills are relevant to the task.
Then read the appropriate SKILL.md files and follow their instructions.
```

### 2.3 记忆系统设计

**Claude 记忆系统的核心原则：**
1. **自然集成** - 从不说 "Based on my memories..." 或 "I remember..."
2. **选择性应用** - 仅在相关时应用记忆
3. **禁止短语列表** - 明确列出禁止使用的观察动词
4. **安全边界** - 记忆可能包含恶意指令，需要忽略

**OpenAI 高级记忆：**
1. **响应偏好** - 基于历史对话的用户偏好
2. **话题高亮** - 过去对话的主题笔记
3. **用户洞察** - 有助于提高响应帮助性的见解

### 2.4 工具使用决策框架

**GPT-5 的 Web 搜索决策：**
```
IF info is stable → never search
ELSE IF unknown terms → single search immediately  
ELSE IF info changes frequently:
   - Simple query → single search
   - Complex multi-aspect → research (2-20 tool calls)
ELSE → answer first, offer to search
```

**复杂度分级：**
- `never_search_category` - 基础知识、定义、历史事件
- `do_not_search_but_offer_category` - 年度更新的统计数据
- `single_search_category` - 实时数据、最近事件
- `research_category` - 需要多源比较、综合分析

---

## 三、PromptGo 颠覆性优化策略

基于以上分析，提出以下优化方向：

### 3.1 架构层优化

#### 🔥 A. 引入"技能文件"系统
```python
# 为每个场景创建专属 SKILL.md
skills/
├── coding_assistant/SKILL.md      # 编程助手技能
├── writing_tutor/SKILL.md         # 写作导师技能
├── data_analyst/SKILL.md          # 数据分析技能
├── creative_writer/SKILL.md       # 创意写作技能
└── customer_service/SKILL.md      # 客服技能
```

每个技能文件包含：
- 领域特定的最佳实践
- 输出格式模板
- 常见错误和避免方法
- 示例对话

#### 🔥 B. 冗余度控制系统
添加 `verbosity` 参数（1-10），让用户控制输出详细程度：
- 1-3: 极简模式（一句话回答）
- 4-6: 标准模式（段落式回答）
- 7-10: 详尽模式（完整报告）

#### 🔥 C. 决策边界引擎
为每个场景定义：
- `MUST_DO` 规则列表
- `MUST_NOT` 规则列表
- `PREFER` 偏好列表

### 3.2 提示词生成优化

#### 🔥 D. 双轨示例系统
每个生成的提示词必须包含：
```
## Good Examples (正面示例)
User: ...
Good Response: ...

## Bad Examples (反面示例)  
User: ...
Bad Response: ... [解释为什么不好]
```

#### 🔥 E. 禁止短语集成
根据场景自动注入"禁止短语"列表：
```
## Forbidden Phrases
NEVER use:
- "I can see..." / "I notice..."
- "Based on..." / "According to..."
- [场景特定的禁止短语]
```

#### 🔥 F. 引用和来源规范
学习 Claude/GPT 的引用系统，为需要事实性输出的场景添加：
```
## Citation Requirements
- Every factual claim must be cited
- Use format: <cite index="...">claim</cite>
- Never reproduce copyrighted content verbatim
```

### 3.3 上下文管理优化

#### 🔥 G. 记忆注入框架
```python
<user_context>
# User Preferences (from past interactions)
1. Prefers concise responses
2. Technical background: Advanced
3. Language style: Professional

# Current Session Context
- Topic: [auto-detected]
- Complexity: [auto-assessed]
</user_context>
```

#### 🔥 H. 自适应风格匹配
```
Match the user's:
- Tone (casual ↔ formal)
- Expertise level (beginner ↔ expert)
- Response length preference
- Language and terminology
```

### 3.4 安全和质量控制

#### 🔥 I. 分层安全系统
```python
safety_layers = {
    "content_policy": [...],      # 内容政策
    "harmful_content": [...],     # 有害内容检测
    "refusal_handling": [...],    # 优雅拒绝策略
    "copyright_protection": [...]  # 版权保护
}
```

#### 🔥 J. 质量验证步骤
学习 Claude Works 的验证步骤：
```
## Verification Step
Include a final verification step for non-trivial tasks:
- Fact-checking
- Verifying math programmatically
- Assessing sources
- Considering counterarguments
```

---

## 四、实施优先级

| 优先级 | 优化项 | 影响范围 | 复杂度 |
|--------|--------|----------|--------|
| P0 | 技能文件系统 | 核心架构 | 高 |
| P0 | 决策边界引擎 | 提示词质量 | 中 |
| P1 | 冗余度控制 | 用户体验 | 低 |
| P1 | 双轨示例系统 | 提示词质量 | 中 |
| P2 | 记忆注入框架 | 个性化 | 高 |
| P2 | 禁止短语集成 | 输出质量 | 低 |
| P3 | 引用规范 | 专业场景 | 中 |
| P3 | 自适应风格 | 用户体验 | 中 |

---

## 五、核心代码改进清单

### 5.1 后端改进

1. **创建技能文件加载器** - `skill_loader.py`
2. **增强意图分类器** - 添加决策边界检测
3. **升级提示词组装器** - 支持多层模板
4. **新增冗余度控制参数** - `verbosity` 参数
5. **实现禁止短语注入** - 自动添加负面规则

### 5.2 前端改进

1. **冗余度滑块** - 让用户控制输出详细程度
2. **技能预览** - 显示当前场景的技能文件内容
3. **高级选项面板** - 决策边界可视化
4. **示例对比视图** - Good/Bad 示例展示

### 5.3 配置文件改进

1. **扩展 prompt_options.json** - 添加技能文件路径
2. **创建 forbidden_phrases.json** - 禁止短语库
3. **创建 decision_boundaries.json** - 决策边界配置
4. **创建 examples_library.json** - 正反示例库

---

## 六、语料库整合建议

### 6.1 将 corpus_cache3 整合到 RAG

1. 解析所有 .md 文件，提取关键模式
2. 建立"元提示词技术"知识库
3. 在生成时检索相关最佳实践

### 6.2 建立提示词模式库

从语料库中提取的可复用模式：
- 工具使用决策树
- 记忆应用规则
- 引用格式规范
- 安全边界定义

---

## 七、实施完成记录 (2026-01-29 更新)

### 7.1 已完成的核心优化

| 优先级 | 优化项 | 状态 | 实现文件 |
|--------|--------|------|----------|
| **P0** | 技能文件系统 | ✅ 已完成 | `backend/app/services/skill_loader.py` + 5个技能文件 |
| **P0** | 决策边界引擎 | ✅ 已完成 | 技能文件中 MUST_DO/MUST_NOT/PREFER 规则 |
| **P1** | 冗余度控制 | ✅ 已完成 | `prompt_assembler.py` + 前端滑块 |
| **P2** | 禁止短语自动注入 | ✅ 已完成 | 技能文件中定义，自动注入提示词 |
| **P2** | 记忆注入框架 | ✅ 已完成 | `backend/app/services/memory_manager.py` |
| **P3** | 引用规范系统 | ✅ 已完成 | `backend/app/services/citation_rules.py` |

### 7.2 新增后端文件

```
backend/app/services/
├── memory_manager.py     # 记忆注入框架（用户偏好、会话上下文、对话高亮）
├── citation_rules.py     # 引用规范系统（引用格式、版权合规、事实核查）
├── skill_loader.py       # 技能文件加载器
└── prompt_assembler.py   # 已集成所有新功能

backend/app/config/skills/
├── coding_assistant.md   # 编程助手技能
├── writing_tutor.md      # 写作导师技能
├── data_analyst.md       # 数据分析师技能
├── creative_writer.md    # 创意写作技能
└── customer_service.md   # 客服助手技能
```

### 7.3 PromptAssembler 新增参数

```python
def assemble(
    scenario: str,
    personality: Optional[str] = None,
    template: str = "standard",
    rag_context: str = "",
    custom_instructions: str = "",
    verbosity: int = 5,                    # P1: 冗余度控制
    enable_skill_injection: bool = True,   # P0: 技能注入
    enable_memory_injection: bool = True,  # P2: 记忆注入 ✨新增
    enable_citation_rules: bool = True     # P3: 引用规范 ✨新增
) -> str
```

### 7.4 新增便捷方法

```python
# 记忆管理
pa.set_user_preference("concise")      # 设置预设偏好
pa.set_custom_preference(key, value)   # 设置自定义偏好
pa.set_session_context(topic, ...)     # 设置会话上下文
pa.add_conversation_highlight(text)    # 添加对话高亮
pa.clear_session_memory()              # 清除会话记忆

# 引用规范
pa.set_citation_preset("strict")       # strict/academic/casual/creative
pa.set_output_preset("detailed")       # standard/detailed/code/structured
```

### 7.5 UI 优化更新

| 改进项 | 说明 |
|--------|------|
| **图标系统** | 全部替换为 Lucide React 矢量图标，移除所有 emoji（小狗除外） |
| **边框增强** | 所有选项卡片边框从 `border` 改为 `border-2`，提高可见性 |
| **悬停提示** | 场景/人设/模板按钮添加 `title` 属性，鼠标悬停显示详细说明 |
| **自定义评估** | 完成状态下新增"自定义优化要求"按钮 |
| **苹果风格** | 采用渐变背景、圆角、阴影等苹果设计语言 |

### 7.6 配置文件更新

`prompt_options.json` 新增字段：
- 所有场景添加 `tooltip` 详细描述
- 所有人设添加 `tooltip` 详细描述
- 所有模板添加 `tooltip` 详细描述
- Auto 场景移除 emoji，图标改为 `Wand2`

### 7.7 Bug 修复

- 修复 `current_understanding` 类型定义（从 `string` 改为 `CurrentUnderstanding | string`）
- 修复前端白屏问题（对象类型渲染错误）

---

*文档版本: 2.0*
*更新时间: 2026-01-29*
*基于语料库: corpus_cache2, corpus_cache3*

#!/usr/bin/env python3
"""
爬取 prompt-writing-corpus.md 中的所有 URL 内容
将内容保存到本地并索引到向量库
"""
import asyncio
import re
import os
import json
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

import httpx

# 语料库 URL 列表（从 prompt-writing-corpus.md 提取）
CORPUS_URLS = [
    # P0 - Prompt 工程与结构化写法
    {
        "id": "ANTHROPIC_PROMPT_OVERVIEW",
        "type": "doc",
        "priority": "P0",
        "url": "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview",
        "topic": "prompting",
        "tags": ["prompting", "system_prompt", "best_practices", "claude"],
        "notes": "官方视角的 prompt 基本原则：清晰、示例、多轮、角色、长上下文技巧等"
    },
    {
        "id": "ANTHROPIC_XML_TAGS",
        "type": "doc",
        "priority": "P0",
        "url": "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags",
        "topic": "prompting",
        "tags": ["prompting", "xml", "context_separation", "anti_injection"],
        "notes": "把 instructions / context / examples / output 分离，降低数据-指令混淆"
    },
    {
        "id": "ANTHROPIC_METAPROMPT",
        "type": "repo",
        "priority": "P0",
        "url": "https://raw.githubusercontent.com/anthropics/anthropic-cookbook/main/misc/metaprompt.ipynb",
        "topic": "prompting",
        "tags": ["metaprompt", "few_shot", "prompt_generator", "examples"],
        "notes": "多样例 few-shot：让模型学会把任务写成高质量 prompt"
    },
    {
        "id": "LANGGPT_FRAMEWORK",
        "type": "repo",
        "priority": "P0",
        "url": "https://raw.githubusercontent.com/langgptai/LangGPT/main/README.md",
        "topic": "prompting",
        "tags": ["langgpt", "structured_prompt", "modules", "compile"],
        "notes": "把 prompt 写作模块化：Role/Profile/Rules/Workflow/Initialization"
    },
    # P0 - 产婆术 / 推理型提示
    {
        "id": "MAIEUTIC_PROMPTING",
        "type": "paper",
        "priority": "P0",
        "url": "https://arxiv.org/abs/2205.11822",
        "topic": "prompting",
        "tags": ["socratic", "maieutic", "clarify", "consistency"],
        "notes": "关键价值：从不完美解释中做一致性归纳（适合追问→自证→收敛）"
    },
    {
        "id": "CHAIN_OF_THOUGHT",
        "type": "paper",
        "priority": "P1",
        "url": "https://arxiv.org/abs/2201.11903",
        "topic": "prompting",
        "tags": ["cot", "reasoning", "self_check"],
        "notes": "适合在生成器内部做为什么这样写的自检"
    },
    {
        "id": "SELF_CONSISTENCY",
        "type": "paper",
        "priority": "P1",
        "url": "https://arxiv.org/abs/2203.11171",
        "topic": "prompting",
        "tags": ["self_consistency", "sampling", "selection"],
        "notes": "多次采样→选最一致结果：适合生成多个 prompt 草案后投票择优"
    },
    {
        "id": "LEAST_TO_MOST",
        "type": "paper",
        "priority": "P1",
        "url": "https://arxiv.org/abs/2205.10625",
        "topic": "prompting",
        "tags": ["decomposition", "clarify", "workflow"],
        "notes": "适合把模糊需求拆成子问题：目标→受众→格式→约束→工具"
    },
    {
        "id": "REACT",
        "type": "paper",
        "priority": "P1",
        "url": "https://arxiv.org/abs/2210.03629",
        "topic": "prompting",
        "tags": ["react", "tool_use", "agent", "trajectories"],
        "notes": "当你要做带工具的提示词生成器/Agent时，ReAct 提供模板化轨迹"
    },
    {
        "id": "TREE_OF_THOUGHTS",
        "type": "paper",
        "priority": "P1",
        "url": "https://arxiv.org/abs/2305.10601",
        "topic": "prompting",
        "tags": ["tot", "search", "self_eval", "candidate_generation"],
        "notes": "适合：生成 2-4 个候选提示词→自评→回溯修正"
    },
    # P0 - 自动优化提示词
    {
        "id": "OPRO",
        "type": "paper",
        "priority": "P0",
        "url": "https://arxiv.org/abs/2309.03409",
        "topic": "prompt_optimization",
        "tags": ["opro", "optimization", "iteration", "evaluate_loop"],
        "notes": "把提示词改写变成迭代优化：候选→评估→反馈→再生成"
    },
    {
        "id": "PROTEGI",
        "type": "paper",
        "priority": "P1",
        "url": "https://arxiv.org/abs/2305.03495",
        "topic": "prompt_optimization",
        "tags": ["protegi", "textual_gradients", "optimization"],
        "notes": "用文本梯度/批评→局部修复迭代改 prompt"
    },
    {
        "id": "DSPY_README",
        "type": "repo",
        "priority": "P0",
        "url": "https://raw.githubusercontent.com/stanfordnlp/dspy/main/README.md",
        "topic": "prompt_optimization",
        "tags": ["dspy", "compile", "optimizer", "evaluation"],
        "notes": "把 prompt 当可编译程序 + 优化器"
    },
    # P0 - RAG 框架
    {
        "id": "LLAMAINDEX_README",
        "type": "repo",
        "priority": "P0",
        "url": "https://raw.githubusercontent.com/run-llama/llama_index/main/README.md",
        "topic": "rag",
        "tags": ["rag", "indexing", "retrieval", "rerank"],
        "notes": "索引/检索/重排/查询引擎/Agent 工具化"
    },
    # P0 - 评测
    {
        "id": "PROMPTFOO_README",
        "type": "repo",
        "priority": "P0",
        "url": "https://raw.githubusercontent.com/promptfoo/promptfoo/main/README.md",
        "topic": "eval",
        "tags": ["eval", "regression", "red_team", "ci"],
        "notes": "把生成器输出当可测试工件：格式遵循、一致性、注入用例、回归"
    },
    # P0 - 结构化输出
    {
        "id": "GUARDRAILS_README",
        "type": "repo",
        "priority": "P0",
        "url": "https://raw.githubusercontent.com/guardrails-ai/guardrails/main/README.md",
        "topic": "structured_output",
        "tags": ["schema", "structured_output", "validation"],
        "notes": "解决：JSON/表格字段跑偏；失败时触发修复/再问"
    },
    {
        "id": "GUIDANCE_README",
        "type": "repo",
        "priority": "P0",
        "url": "https://raw.githubusercontent.com/guidance-ai/guidance/main/README.md",
        "topic": "structured_output",
        "tags": ["constrained_decoding", "regex", "cfg", "structured_output"],
        "notes": "当你需要强制格式（JSON/DSL）时，constrained decoding 是硬武器"
    },
    # P0 - 安全
    {
        "id": "PROMPT_INJECTION_HOUYI",
        "type": "paper",
        "priority": "P0",
        "url": "https://arxiv.org/abs/2306.05499",
        "topic": "security",
        "tags": ["prompt_injection", "security", "defense"],
        "notes": "真实应用中的注入攻击拆解；RAG/Agent 必读"
    },
    {
        "id": "INDIRECT_PROMPT_INJECTION",
        "type": "paper",
        "priority": "P0",
        "url": "https://arxiv.org/abs/2302.12173",
        "topic": "security",
        "tags": ["indirect_injection", "rag_security", "data_instruction_confusion"],
        "notes": "RAG 检索到的网页/邮件/文档里夹带指令→劫持 Agent 的经典路径"
    },
    {
        "id": "INJECAGENT",
        "type": "paper",
        "priority": "P0",
        "url": "https://arxiv.org/abs/2403.02691",
        "topic": "security",
        "tags": ["benchmark", "agent_security", "indirect_injection"],
        "notes": "给你的生成器加注入回归测试集的参考标准"
    },
    {
        "id": "SYSTEM_PROMPT_POISONING",
        "type": "paper",
        "priority": "P0",
        "url": "https://arxiv.org/abs/2505.06493",
        "topic": "security",
        "tags": ["system_prompt", "poisoning", "persistence"],
        "notes": "系统提示一旦被污染会持久影响后续交互"
    },
    # P0 - 指令层级
    {
        "id": "IHEVAL",
        "type": "paper",
        "priority": "P0",
        "url": "https://arxiv.org/abs/2502.08745",
        "topic": "instruction_hierarchy",
        "tags": ["instruction_hierarchy", "eval", "safety"],
        "notes": "教会系统：SYSTEM/DEVELOPER/USER/历史/工具输出冲突时如何判定"
    },
    # P1 - 模板库
    {
        "id": "FABRIC_README",
        "type": "repo",
        "priority": "P1",
        "url": "https://raw.githubusercontent.com/danielmiessler/fabric/main/README.md",
        "topic": "prompting",
        "tags": ["patterns", "template_library", "standardization"],
        "notes": "大量 patterns；适合抽取统一结构"
    },
    {
        "id": "DAIR_PROMPTING_GUIDE",
        "type": "repo",
        "priority": "P1",
        "url": "https://raw.githubusercontent.com/dair-ai/Prompt-Engineering-Guide/main/README.md",
        "topic": "prompting",
        "tags": ["guide", "survey", "prompting", "rag", "agents"],
        "notes": "覆盖 prompting/RAG/agents/技巧合集"
    },
    # Prompt Pattern Catalog
    {
        "id": "PROMPT_PATTERN_CATALOG",
        "type": "paper",
        "priority": "P0",
        "url": "https://arxiv.org/abs/2302.11382",
        "topic": "prompting",
        "tags": ["patterns", "prompt_components", "persona", "workflow", "format"],
        "notes": "把提示词写作抽象为可复用 Pattern：Persona/Recipe/Format/Refusal/…"
    },
]

# 输出目录
OUTPUT_DIR = Path(__file__).parent.parent / "data" / "corpus_cache"


async def fetch_url(client: httpx.AsyncClient, url: str) -> Optional[str]:
    """获取 URL 内容"""
    try:
        # 处理 arXiv 论文 - 获取摘要页
        if "arxiv.org/abs/" in url:
            response = await client.get(url, follow_redirects=True, timeout=30)
            if response.status_code == 200:
                return response.text
        else:
            response = await client.get(url, follow_redirects=True, timeout=30)
            if response.status_code == 200:
                return response.text
        return None
    except Exception as e:
        print(f"  ❌ 获取失败: {url} - {e}")
        return None


def extract_arxiv_abstract(html: str) -> str:
    """从 arXiv 页面提取摘要"""
    # 简单的正则提取
    abstract_match = re.search(r'<blockquote class="abstract[^"]*">\s*<span class="descriptor">Abstract:</span>\s*(.*?)</blockquote>', html, re.DOTALL)
    if abstract_match:
        abstract = abstract_match.group(1).strip()
        # 清理 HTML 标签
        abstract = re.sub(r'<[^>]+>', '', abstract)
        return abstract
    return ""


def extract_title(html: str, url: str) -> str:
    """提取页面标题"""
    title_match = re.search(r'<title>([^<]+)</title>', html, re.IGNORECASE)
    if title_match:
        return title_match.group(1).strip()
    return url.split("/")[-1]


def clean_html(html: str) -> str:
    """清理 HTML，提取纯文本"""
    # 移除 script 和 style
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)
    # 移除 HTML 标签
    text = re.sub(r'<[^>]+>', ' ', html)
    # 清理多余空白
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
    """将文本切分为块"""
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        
        # 尝试在句子边界切分
        if end < len(text):
            for sep in ['\n\n', '\n', '。', '.', '！', '!', '？', '?', '；', ';']:
                last_sep = text.rfind(sep, start, end)
                if last_sep > start + chunk_size // 2:
                    end = last_sep + len(sep)
                    break
        
        chunk = text[start:end].strip()
        if chunk and len(chunk) > 50:  # 过滤太短的块
            chunks.append(chunk)
        
        start = end - overlap
    
    return chunks


async def crawl_all():
    """爬取所有 URL"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    all_documents = []
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    }
    
    async with httpx.AsyncClient(headers=headers) as client:
        for item in CORPUS_URLS:
            url = item["url"]
            doc_id = item["id"]
            doc_type = item["type"]
            
            print(f"📥 正在获取: {doc_id} ({doc_type})")
            print(f"   URL: {url}")
            
            content = await fetch_url(client, url)
            
            if not content:
                print(f"   ⚠️ 跳过（无法获取）")
                continue
            
            # 根据类型处理内容
            if doc_type == "paper" and "arxiv.org" in url:
                # arXiv 论文 - 提取摘要
                abstract = extract_arxiv_abstract(content)
                title = extract_title(content, url)
                
                if abstract:
                    processed_content = f"# {title}\n\n## Abstract\n{abstract}\n\n## Notes\n{item['notes']}"
                else:
                    processed_content = f"# {title}\n\n## Notes\n{item['notes']}"
            elif doc_type == "repo":
                # GitHub README - 直接使用
                processed_content = content
            else:
                # 文档页面 - 清理 HTML
                title = extract_title(content, url)
                text = clean_html(content)
                processed_content = f"# {title}\n\n{text[:5000]}"  # 限制长度
            
            # 切块
            chunks = chunk_text(processed_content)
            
            print(f"   ✅ 获取成功，切分为 {len(chunks)} 个块")
            
            # 保存到本地
            cache_file = OUTPUT_DIR / f"{doc_id}.json"
            cache_data = {
                "id": doc_id,
                "url": url,
                "type": doc_type,
                "priority": item["priority"],
                "topic": item["topic"],
                "tags": item["tags"],
                "notes": item["notes"],
                "content": processed_content,
                "chunks": chunks,
                "fetched_at": datetime.now().isoformat()
            }
            
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)
            
            # 准备文档数据
            for i, chunk in enumerate(chunks):
                all_documents.append({
                    "doc_id": f"{doc_id}_chunk_{i}",
                    "content": chunk,
                    "metadata": {
                        "source_id": doc_id,
                        "source_type": doc_type,
                        "source_url": url,
                        "priority": item["priority"],
                        "topic": item["topic"],
                        "tags": ",".join(item["tags"]),
                        "notes": item["notes"],
                        "chunk_index": i,
                        "total_chunks": len(chunks),
                        "type": "corpus_knowledge"
                    }
                })
            
            # 避免请求过快
            await asyncio.sleep(0.5)
    
    # 保存汇总文件
    summary_file = OUTPUT_DIR / "_all_documents.json"
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(all_documents, f, ensure_ascii=False, indent=2)
    
    print(f"\n📊 爬取完成！")
    print(f"   总文档数: {len(CORPUS_URLS)}")
    print(f"   总块数: {len(all_documents)}")
    print(f"   缓存目录: {OUTPUT_DIR}")
    
    return all_documents


if __name__ == "__main__":
    asyncio.run(crawl_all())

"""
系统配置 API 路由 - 提供后端配置的可视化和编辑接口
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/system", tags=["system"])


class APIEndpoint(BaseModel):
    """API 端点信息"""
    method: str
    path: str
    description: str
    tags: List[str]


class FrameworkTemplate(BaseModel):
    """框架模板"""
    id: str
    name: str
    description: str
    template: str


class SystemPromptInfo(BaseModel):
    """系统提示词信息"""
    name: str
    description: str
    content: str
    editable: bool = False


class BuiltinKnowledge(BaseModel):
    """内置知识条目"""
    id: str
    title: str
    content_preview: str
    metadata: Dict[str, Any]


class SystemConfigResponse(BaseModel):
    """系统配置响应"""
    api_endpoints: List[APIEndpoint]
    framework_templates: List[FrameworkTemplate]
    system_prompts: List[SystemPromptInfo]
    builtin_knowledge: List[BuiltinKnowledge]
    rag_stats: Dict[str, Any]


@router.get("/config", response_model=SystemConfigResponse)
async def get_system_config():
    """
    获取系统配置一览
    
    包括：
    - API 端点列表
    - 框架模板
    - 系统提示词
    - 内置知识库
    - RAG 统计
    """
    from ..services.socratic_engine import SOCRATIC_SYSTEM_PROMPT, PROMPT_FRAMEWORK_TEMPLATES
    from ..services.corpus_loader import CorpusLoader
    from ..services.rag_service import get_rag_service
    
    # 1. API 端点列表
    api_endpoints = [
        APIEndpoint(
            method="POST",
            path="/api/conversations",
            description="创建新对话，开始苏格拉底式提问",
            tags=["conversations"]
        ),
        APIEndpoint(
            method="POST",
            path="/api/conversations/{id}/messages",
            description="发送消息，继续对话",
            tags=["conversations"]
        ),
        APIEndpoint(
            method="GET",
            path="/api/conversations",
            description="获取对话历史列表",
            tags=["conversations"]
        ),
        APIEndpoint(
            method="GET",
            path="/api/prompts",
            description="获取已保存的提示词列表",
            tags=["prompts"]
        ),
        APIEndpoint(
            method="POST",
            path="/api/prompts",
            description="保存生成的提示词",
            tags=["prompts"]
        ),
        APIEndpoint(
            method="POST",
            path="/api/documents/parse",
            description="解析上传的文档（简单模式）",
            tags=["documents"]
        ),
        APIEndpoint(
            method="POST",
            path="/api/documents/parse-and-index",
            description="解析文档并索引到向量库（完整 RAG）",
            tags=["documents", "rag"]
        ),
        APIEndpoint(
            method="POST",
            path="/api/rag/index-builtin",
            description="索引内置知识到向量库",
            tags=["rag"]
        ),
        APIEndpoint(
            method="POST",
            path="/api/rag/search",
            description="语义检索知识库",
            tags=["rag"]
        ),
        APIEndpoint(
            method="GET",
            path="/api/rag/stats",
            description="获取知识库统计信息",
            tags=["rag"]
        ),
        APIEndpoint(
            method="DELETE",
            path="/api/rag/clear",
            description="清空知识库索引",
            tags=["rag"]
        ),
        APIEndpoint(
            method="GET",
            path="/api/system/config",
            description="获取系统配置一览（本接口）",
            tags=["system"]
        ),
    ]
    
    # 2. 框架模板
    framework_templates = [
        FrameworkTemplate(
            id="standard",
            name="标准格式",
            description="角色/任务/约束/输出格式，适合通用场景",
            template=PROMPT_FRAMEWORK_TEMPLATES.get("standard", "")
        ),
        FrameworkTemplate(
            id="langgpt",
            name="LangGPT",
            description="结构化角色扮演模板，包含技能和工作流",
            template=PROMPT_FRAMEWORK_TEMPLATES.get("langgpt", "")
        ),
        FrameworkTemplate(
            id="costar",
            name="CO-STAR",
            description="背景/目标/风格/语气/受众/响应，适合内容创作",
            template=PROMPT_FRAMEWORK_TEMPLATES.get("costar", "")
        ),
        FrameworkTemplate(
            id="structured",
            name="XML 结构化",
            description="使用 XML 标签分离指令与数据，便于程序解析",
            template=PROMPT_FRAMEWORK_TEMPLATES.get("structured", "")
        ),
    ]
    
    # 3. 系统提示词
    system_prompts = [
        SystemPromptInfo(
            name="苏格拉底引导提示词",
            description="核心系统提示词，定义产婆术对话流程和输出格式",
            content=SOCRATIC_SYSTEM_PROMPT,
            editable=False
        ),
    ]
    
    # 4. 内置知识库
    loader = CorpusLoader()
    builtin_docs = loader.load_builtin_knowledge()
    builtin_knowledge = []
    
    # 按 source_id 去重
    seen_ids = set()
    for doc in builtin_docs:
        source_id = doc.get("metadata", {}).get("source_id", doc.get("doc_id", ""))
        if source_id not in seen_ids:
            seen_ids.add(source_id)
            builtin_knowledge.append(BuiltinKnowledge(
                id=source_id,
                title=source_id.replace("_", " ").title(),
                content_preview=doc.get("content", "")[:200] + "...",
                metadata=doc.get("metadata", {})
            ))
    
    # 5. RAG 统计
    try:
        rag_service = get_rag_service()
        rag_stats = rag_service.get_collection_stats()
    except Exception:
        rag_stats = {"name": "prompt_knowledge", "count": 0, "status": "未初始化"}
    
    return SystemConfigResponse(
        api_endpoints=api_endpoints,
        framework_templates=framework_templates,
        system_prompts=system_prompts,
        builtin_knowledge=builtin_knowledge,
        rag_stats=rag_stats
    )


@router.get("/prompts/socratic")
async def get_socratic_prompt():
    """获取苏格拉底系统提示词全文"""
    from ..services.socratic_engine import SOCRATIC_SYSTEM_PROMPT
    return {"content": SOCRATIC_SYSTEM_PROMPT}


@router.get("/prompts/frameworks")
async def get_framework_templates():
    """获取所有框架模板"""
    from ..services.socratic_engine import PROMPT_FRAMEWORK_TEMPLATES
    return {"templates": PROMPT_FRAMEWORK_TEMPLATES}


@router.get("/knowledge/builtin")
async def get_builtin_knowledge():
    """获取内置知识库详情"""
    from ..services.corpus_loader import CorpusLoader
    loader = CorpusLoader()
    docs = loader.load_builtin_knowledge()
    return {"documents": docs, "count": len(docs)}

"""
RAG API 路由
"""
from fastapi import APIRouter, HTTPException, Form
from typing import Optional, List
from pydantic import BaseModel

from ..services.rag_service import RAGService, get_rag_service
from ..services.corpus_loader import CorpusLoader

router = APIRouter(prefix="/api/rag", tags=["rag"])


class SearchRequest(BaseModel):
    query: str
    n_results: int = 5
    filter_topic: Optional[str] = None


class SearchResult(BaseModel):
    id: str
    content: str
    metadata: dict
    relevance_score: float


class SearchResponse(BaseModel):
    results: List[SearchResult]
    query: str


class IndexResponse(BaseModel):
    success: bool
    message: str
    documents_count: int


class StatsResponse(BaseModel):
    name: str
    count: int
    persist_directory: str


@router.post("/search", response_model=SearchResponse)
async def search_knowledge(
    request: SearchRequest,
    api_key: Optional[str] = Form(None)
):
    """
    语义检索知识库
    
    Args:
        request: 搜索请求
        api_key: Embedding API Key（可选，使用环境变量）
    """
    try:
        rag_service = get_rag_service(embedding_api_key=api_key)
        
        filter_metadata = None
        if request.filter_topic:
            filter_metadata = {"topic": request.filter_topic}
        
        results = await rag_service.search(
            query=request.query,
            n_results=request.n_results,
            filter_metadata=filter_metadata
        )
        
        return SearchResponse(
            results=[
                SearchResult(
                    id=r["id"],
                    content=r["content"],
                    metadata=r["metadata"],
                    relevance_score=r["relevance_score"]
                )
                for r in results
            ],
            query=request.query
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/index", response_model=IndexResponse)
async def index_corpus(
    api_key: str = Form(...),
    include_urls: bool = Form(True)
):
    """
    索引语料库到向量数据库
    
    Args:
        api_key: Embedding API Key（必需）
        include_urls: 是否爬取 URL 内容（默认 True）
    """
    try:
        # 加载语料
        loader = CorpusLoader()
        documents = await loader.load_all(include_urls=include_urls)
        
        if not documents:
            return IndexResponse(
                success=False,
                message="没有加载到任何文档",
                documents_count=0
            )
        
        # 索引到向量库
        rag_service = get_rag_service(embedding_api_key=api_key)
        doc_ids = await rag_service.add_documents_batch(documents)
        
        return IndexResponse(
            success=True,
            message=f"成功索引 {len(doc_ids)} 个文档块",
            documents_count=len(doc_ids)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/index-builtin", response_model=IndexResponse)
async def index_builtin_only(
    api_key: str = Form(...)
):
    """
    仅索引内置知识（不爬取 URL）
    
    Args:
        api_key: Embedding API Key（必需）
    """
    try:
        loader = CorpusLoader()
        documents = loader.load_builtin_knowledge()
        
        if not documents:
            return IndexResponse(
                success=False,
                message="没有加载到任何文档",
                documents_count=0
            )
        
        rag_service = get_rag_service(embedding_api_key=api_key)
        doc_ids = await rag_service.add_documents_batch(documents)
        
        return IndexResponse(
            success=True,
            message=f"成功索引 {len(doc_ids)} 个内置知识块",
            documents_count=len(doc_ids)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """获取知识库统计信息"""
    try:
        rag_service = get_rag_service()
        stats = rag_service.get_collection_stats()
        return StatsResponse(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/clear")
async def clear_index():
    """清空知识库索引"""
    try:
        rag_service = get_rag_service()
        rag_service.clear_collection()
        return {"success": True, "message": "知识库已清空"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

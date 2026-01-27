"""
文档解析 API 路由
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional, List
from pydantic import BaseModel

from ..services.document_parser import DocumentParser
from ..services.rag_service import RAGService

router = APIRouter(prefix="/api/documents", tags=["documents"])


class DocumentRAGResponse(BaseModel):
    """文档 RAG 处理响应"""
    success: bool
    message: str
    document_id: str
    chunks_count: int
    content_preview: str


@router.post("/parse")
async def parse_document(
    file: UploadFile = File(...),
    api_key: Optional[str] = Form(None),
    base_url: Optional[str] = Form(None),
    model: Optional[str] = Form(None),
):
    """
    解析上传的文档
    
    支持格式：
    - 图片 (PNG, JPG, JPEG) - 使用多模态 LLM OCR
    - PDF - 文本提取 + OCR（扫描件）
    - Word (DOC, DOCX) - 文本和表格提取
    - 纯文本 (TXT, MD)
    
    Args:
        file: 上传的文件
        api_key: 可选，用于多模态 LLM 调用
        base_url: 可选，自定义 API 地址
        model: 可选，指定模型（默认 qwen-vl-max）
    
    Returns:
        { "content": "解析后的文本", "metadata": {...} }
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")
    
    # 读取文件内容
    content = await file.read()
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="文件内容为空")
    
    if len(content) > 20 * 1024 * 1024:  # 20MB 限制
        raise HTTPException(status_code=400, detail="文件大小超过 20MB 限制")
    
    # 创建解析器
    parser = DocumentParser(
        api_key=api_key,
        base_url=base_url,
        model=model
    )
    
    # 解析文件
    result = await parser.parse_file(
        file_content=content,
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream"
    )
    
    return result


@router.post("/parse-with-settings")
async def parse_document_with_settings(
    file: UploadFile = File(...),
):
    """
    使用前端传递的设置解析文档（从请求头获取配置）
    这个端点更简单，配置从 localStorage 同步
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")
    
    content = await file.read()
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="文件内容为空")
    
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="文件大小超过 20MB 限制")
    
    # 使用默认配置（可以从环境变量读取）
    parser = DocumentParser()
    
    result = await parser.parse_file(
        file_content=content,
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream"
    )
    
    return result


def _chunk_text_for_rag(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """将文本切分为块（用于 RAG 索引）"""
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        
        if end < len(text):
            for sep in ['\n\n', '\n', '。', '.', '！', '!', '？', '?']:
                last_sep = text.rfind(sep, start, end)
                if last_sep > start + chunk_size // 2:
                    end = last_sep + len(sep)
                    break
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        start = end - overlap
    
    return chunks


@router.post("/parse-and-index", response_model=DocumentRAGResponse)
async def parse_and_index_document(
    file: UploadFile = File(...),
    api_key: str = Form(...),
    base_url: Optional[str] = Form(None),
    model: Optional[str] = Form(None),
    conversation_id: Optional[str] = Form(None),
):
    """
    解析文档并索引到向量库（完整 RAG 流程）
    
    流程：
    1. 解析文档（PDF/Word/图片OCR）
    2. 切块（Chunking）
    3. Embedding 向量化
    4. 存入 ChromaDB
    """
    import hashlib
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")
    
    file_content = await file.read()
    
    if len(file_content) == 0:
        raise HTTPException(status_code=400, detail="文件内容为空")
    
    if len(file_content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="文件大小超过 20MB 限制")
    
    # 1. 解析文档
    parser = DocumentParser(
        api_key=api_key,
        base_url=base_url or "https://dashscope.aliyuncs.com/compatible-mode/v1",
        model=model or "qwen-vl-max"
    )
    
    try:
        parse_result = await parser.parse_file(
            file_content=file_content,
            filename=file.filename,
            content_type=file.content_type or "application/octet-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文档解析失败: {str(e)}")
    
    parsed_text = parse_result.get("content", "")
    if not parsed_text or len(parsed_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="文档内容为空或过短")
    
    # 2. 切块（Chunking）
    chunks = _chunk_text_for_rag(parsed_text, chunk_size=500, overlap=50)
    
    if not chunks:
        raise HTTPException(status_code=400, detail="文档切块失败")
    
    # 3. 生成文档 ID
    file_hash = hashlib.md5(file_content).hexdigest()[:8]
    doc_id = f"user_doc_{file_hash}"
    
    # 4. 准备文档数据
    documents = []
    for i, chunk in enumerate(chunks):
        documents.append({
            "doc_id": f"{doc_id}_chunk_{i}",
            "content": chunk,
            "metadata": {
                "source_id": doc_id,
                "source_type": "user_upload",
                "filename": file.filename,
                "conversation_id": conversation_id or "global",
                "chunk_index": i,
                "total_chunks": len(chunks),
                "type": "user_document",
                "topic": "user_knowledge"
            }
        })
    
    # 5. Embedding + 存入向量库
    try:
        rag_service = RAGService(
            collection_name="user_documents",
            embedding_api_key=api_key,
            embedding_base_url=base_url or "https://dashscope.aliyuncs.com/compatible-mode/v1"
        )
        
        await rag_service.add_documents_batch(documents)
        
        return DocumentRAGResponse(
            success=True,
            message=f"文档已索引：{len(chunks)} 个片段",
            document_id=doc_id,
            chunks_count=len(chunks),
            content_preview=parsed_text[:200] + "..." if len(parsed_text) > 200 else parsed_text
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"向量索引失败: {str(e)}")

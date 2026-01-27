"""
文档解析 API 路由
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional

from ..services.document_parser import DocumentParser

router = APIRouter(prefix="/api/documents", tags=["documents"])


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

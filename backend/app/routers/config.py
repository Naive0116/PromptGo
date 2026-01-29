"""
配置 API 端点 - 提供场景/人设/模板配置和意图分类
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from ..services.intent_classifier import get_intent_classifier
from ..services.prompt_assembler import get_prompt_assembler

router = APIRouter(prefix="/api/config", tags=["config"])


class IntentClassifyRequest(BaseModel):
    user_input: str


class IntentClassifyResponse(BaseModel):
    scenario: str
    personality: Optional[str]
    template: str
    confidence: float
    matched_keywords: List[str]


class SkeletonPreviewRequest(BaseModel):
    scenario: str
    personality: Optional[str] = None
    template: str = "standard"


class SkeletonPreviewResponse(BaseModel):
    skeleton: str


@router.get("/prompt-options")
async def get_prompt_options() -> Dict[str, Any]:
    """
    获取完整的提示词配置选项
    包括场景、人设、模板和兼容矩阵
    """
    classifier = get_intent_classifier()
    
    return {
        "scenarios": classifier.get_all_scenarios(),
        "personalities": classifier.get_all_personalities(),
        "templates": classifier.get_all_templates(),
        "compatibility_matrix": classifier.get_compatibility_matrix(),
        "default_mode": "auto"
    }


@router.post("/classify-intent", response_model=IntentClassifyResponse)
async def classify_intent(request: IntentClassifyRequest) -> IntentClassifyResponse:
    """
    对用户输入进行意图分类
    返回推荐的场景、人设和模板
    """
    if not request.user_input.strip():
        raise HTTPException(status_code=400, detail="用户输入不能为空")
    
    classifier = get_intent_classifier()
    result = classifier.classify(request.user_input)
    
    return IntentClassifyResponse(
        scenario=result["scenario"],
        personality=result["personality"],
        template=result["template"],
        confidence=result["confidence"],
        matched_keywords=result["matched_keywords"]
    )


@router.post("/preview-skeleton", response_model=SkeletonPreviewResponse)
async def preview_skeleton(request: SkeletonPreviewRequest) -> SkeletonPreviewResponse:
    """
    获取提示词骨架预览
    不调用 LLM，直接返回模板结构
    """
    assembler = get_prompt_assembler()
    skeleton = assembler.get_skeleton_preview(
        scenario=request.scenario,
        personality=request.personality,
        template=request.template
    )
    
    return SkeletonPreviewResponse(skeleton=skeleton)


@router.get("/scenarios")
async def get_scenarios() -> List[Dict[str, Any]]:
    """获取场景列表"""
    classifier = get_intent_classifier()
    return classifier.get_all_scenarios()


@router.get("/personalities")
async def get_personalities() -> List[Dict[str, Any]]:
    """获取人设列表"""
    classifier = get_intent_classifier()
    return classifier.get_all_personalities()


@router.get("/templates")
async def get_templates() -> List[Dict[str, Any]]:
    """获取模板列表"""
    classifier = get_intent_classifier()
    return classifier.get_all_templates()

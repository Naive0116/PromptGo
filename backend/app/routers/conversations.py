from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..database.db import get_db
from ..database.crud import ConversationCRUD, MessageCRUD, PromptCRUD
from ..schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    ConversationDetailResponse,
    MessageCreate,
    ConversationStartResponse,
    ConversationMessageResponse
)
from ..services.llm_service import get_llm_provider
from ..services.socratic_engine import SocraticEngine
from ..models.conversation import ConversationStatus

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.post("", response_model=ConversationStartResponse)
async def create_conversation(
    data: ConversationCreate,
    db: AsyncSession = Depends(get_db)
):
    config = data.config
    max_turns = config.max_turns if config and config.max_turns else 5
    prompt_framework = config.prompt_framework if config else "standard"
    llm_provider = config.llm_provider if config else None
    base_url = config.base_url if config else None
    api_key = config.api_key if config else None
    llm_model = config.model if config else None
    
    conversation = await ConversationCRUD.create(
        db,
        data.initial_idea,
        max_turns=max_turns,
        llm_provider=llm_provider,
        base_url=base_url,
        api_key=api_key,
        llm_model=llm_model,
        prompt_framework=prompt_framework
    )

    llm = get_llm_provider(
        provider_name=llm_provider,
        api_key=api_key,
        model=llm_model,
        base_url=base_url
    )
    engine = SocraticEngine(llm, max_turns=max_turns, prompt_framework=prompt_framework)
    result = await engine.start_conversation(data.initial_idea)

    await MessageCRUD.create(
        db,
        conversation.id,
        "assistant",
        result.get("question", "") if result["type"] == "question" else result.get("raw_text", "")
    )

    return ConversationStartResponse(
        conversation_id=conversation.id,
        status=conversation.status.value,
        current_turn=int(conversation.current_turn),
        max_turns=max_turns,
        response=result
    )


@router.get("", response_model=List[ConversationResponse])
async def list_conversations(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    conversations = await ConversationCRUD.get_all(db, limit, offset)
    return [ConversationResponse.from_orm_with_int(c) for c in conversations]


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db)
):
    conversation = await ConversationCRUD.get_by_id(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return ConversationDetailResponse(
        id=conversation.id,
        initial_idea=conversation.initial_idea,
        status=conversation.status.value,
        current_turn=int(conversation.current_turn),
        max_turns=int(conversation.max_turns),
        created_at=conversation.created_at,
        messages=[
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at
            }
            for m in conversation.messages
        ],
        prompt={
            "id": conversation.prompt.id,
            "raw_text": conversation.prompt.raw_text,
            "role_definition": conversation.prompt.role_definition,
            "task_description": conversation.prompt.task_description,
            "constraints": conversation.prompt.constraints,
            "output_format": conversation.prompt.output_format,
            "tags": conversation.prompt.tags
        } if conversation.prompt else None
    )


@router.post("/{conversation_id}/messages", response_model=ConversationMessageResponse)
async def send_message(
    conversation_id: str,
    data: MessageCreate,
    db: AsyncSession = Depends(get_db)
):
    conversation = await ConversationCRUD.get_by_id(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conversation.status == ConversationStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Conversation already completed")

    await MessageCRUD.create(db, conversation_id, "user", data.content)

    # 关键：SQLite 在写事务期间会锁库；这里先提交释放写锁，再进行耗时的 LLM 调用
    await db.commit()

    messages = [
        {"role": m.role, "content": m.content}
        for m in conversation.messages
    ]
    messages.append({"role": "user", "content": data.content})

    current_turn = int(conversation.current_turn) + 1
    await ConversationCRUD.update_turn(db, conversation, current_turn)

    # 同上：turn 更新也需要尽快落库，避免长事务持锁
    await db.commit()

    llm = get_llm_provider(
        provider_name=conversation.llm_provider,
        api_key=conversation.api_key,
        model=conversation.llm_model,
        base_url=conversation.base_url
    )
    engine = SocraticEngine(
        llm,
        max_turns=int(conversation.max_turns),
        prompt_framework=conversation.prompt_framework or "standard"
    )
    result = await engine.continue_conversation(
        conversation.initial_idea,
        messages[:-1],
        data.content,
        current_turn
    )

    if result["type"] == "question":
        await MessageCRUD.create(db, conversation_id, "assistant", result["question"])
    else:
        await MessageCRUD.create(db, conversation_id, "assistant", result["raw_text"])
        await ConversationCRUD.complete(db, conversation)

        prompt_data = result.get("prompt", {})
        await PromptCRUD.create(
            db,
            conversation_id=conversation_id,
            raw_text=result["raw_text"],
            role_definition=prompt_data.get("role"),
            task_description=prompt_data.get("task"),
            constraints=prompt_data.get("constraints", []),
            output_format=prompt_data.get("output_format"),
            examples=prompt_data.get("examples", []),
            tags=result.get("tags", [])
        )

    # 结果写入后提交，缩短锁持有时间
    await db.commit()

    return ConversationMessageResponse(
        status=conversation.status.value if result["type"] == "question" else "completed",
        current_turn=current_turn,
        max_turns=int(conversation.max_turns),
        response=result
    )


@router.post("/{conversation_id}/refine")
async def refine_prompt(
    conversation_id: str,
    data: MessageCreate,
    db: AsyncSession = Depends(get_db)
):
    conversation = await ConversationCRUD.get_by_id(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if not conversation.prompt:
        raise HTTPException(status_code=400, detail="No prompt to refine")

    await MessageCRUD.create(db, conversation_id, "user", data.content)

    # 关键：先提交释放写锁，再进行耗时的 LLM 调用
    await db.commit()

    llm = get_llm_provider(
        provider_name=conversation.llm_provider,
        api_key=conversation.api_key,
        model=conversation.llm_model,
        base_url=conversation.base_url
    )
    
    refine_prompt_text = f"""你是一位提示词优化专家。用户已经生成了一个提示词，现在希望对其进行调整。

当前提示词：
{conversation.prompt.raw_text}

用户的调整要求：
{data.content}

请根据用户的要求，优化并输出新的提示词。必须严格按照以下JSON格式输出：

```json
{{
  "prompt": {{
    "role": "角色定义文本",
    "task": "任务描述文本",
    "constraints": ["约束1", "约束2"],
    "output_format": "输出格式说明",
    "examples": []
  }},
  "raw_text": "完整的、可直接使用的提示词文本",
  "tags": ["标签1", "标签2"]
}}
```
"""

    response = await llm.chat(
        messages=[{"role": "user", "content": refine_prompt_text}],
        temperature=0.7
    )

    import json
    import re
    
    json_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
    if json_match:
        json_str = json_match.group(1)
    else:
        json_str = response.strip()
    
    try:
        result = json.loads(json_str.strip())
    except json.JSONDecodeError:
        result = {
            "prompt": {
                "role": conversation.prompt.role_definition or "",
                "task": conversation.prompt.task_description or "",
                "constraints": conversation.prompt.constraints or [],
                "output_format": conversation.prompt.output_format or "",
                "examples": []
            },
            "raw_text": response,
            "tags": conversation.prompt.tags or []
        }

    await MessageCRUD.create(db, conversation_id, "assistant", result["raw_text"])

    prompt_data = result.get("prompt", {})
    await PromptCRUD.update(
        db,
        conversation.prompt,
        raw_text=result["raw_text"],
        role_definition=prompt_data.get("role"),
        task_description=prompt_data.get("task"),
        constraints=prompt_data.get("constraints", []),
        output_format=prompt_data.get("output_format"),
        tags=result.get("tags", [])
    )

    await db.commit()

    return result


@router.post("/{conversation_id}/rethink", response_model=ConversationMessageResponse)
async def rethink_question(
    conversation_id: str,
    db: AsyncSession = Depends(get_db)
):
    """换个思路：重新生成当前问题和选项"""
    conversation = await ConversationCRUD.get_by_id(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conversation.status == ConversationStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Conversation already completed")

    messages = [
        {"role": m.role, "content": m.content}
        for m in conversation.messages
    ]

    llm = get_llm_provider(
        provider_name=conversation.llm_provider,
        api_key=conversation.api_key,
        model=conversation.llm_model,
        base_url=conversation.base_url
    )
    engine = SocraticEngine(
        llm,
        max_turns=int(conversation.max_turns),
        prompt_framework=conversation.prompt_framework or "standard"
    )
    
    # 使用特殊指令让LLM换个思路
    rethink_context = f"""用户希望换个思路来思考这个任务。

原始任务：{conversation.initial_idea}

请从不同的角度重新提问，给出新的问题和选项。不要重复之前的问题，尝试从其他维度来引导用户。"""

    result = await engine.process(
        conversation.initial_idea,
        messages + [{"role": "user", "content": rethink_context}],
        int(conversation.current_turn)
    )

    if result["type"] == "question":
        await MessageCRUD.create(db, conversation_id, "assistant", result["question"])
    else:
        await MessageCRUD.create(db, conversation_id, "assistant", result["raw_text"])

    return ConversationMessageResponse(
        status=conversation.status.value,
        current_turn=int(conversation.current_turn),
        max_turns=int(conversation.max_turns),
        response=result
    )


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db)
):
    conversation = await ConversationCRUD.get_by_id(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await ConversationCRUD.delete(db, conversation)
    return {"message": "Conversation deleted"}

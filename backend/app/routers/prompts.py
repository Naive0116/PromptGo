from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..database.db import get_db
from ..database.crud import PromptCRUD
from ..schemas.prompt import PromptResponse, PromptUpdate

router = APIRouter(prefix="/api/prompts", tags=["prompts"])


@router.get("", response_model=List[PromptResponse])
async def list_prompts(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    prompts = await PromptCRUD.get_all(db, limit, offset)
    return prompts


@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(
    prompt_id: str,
    db: AsyncSession = Depends(get_db)
):
    prompt = await PromptCRUD.get_by_id(db, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return prompt


@router.put("/{prompt_id}", response_model=PromptResponse)
async def update_prompt(
    prompt_id: str,
    data: PromptUpdate,
    db: AsyncSession = Depends(get_db)
):
    prompt = await PromptCRUD.get_by_id(db, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    updated = await PromptCRUD.update(
        db,
        prompt,
        raw_text=data.raw_text,
        role_definition=data.role_definition,
        task_description=data.task_description,
        constraints=data.constraints,
        output_format=data.output_format,
        tags=data.tags
    )
    return updated


@router.delete("/{prompt_id}")
async def delete_prompt(
    prompt_id: str,
    db: AsyncSession = Depends(get_db)
):
    prompt = await PromptCRUD.get_by_id(db, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    await PromptCRUD.delete(db, prompt)
    return {"message": "Prompt deleted"}

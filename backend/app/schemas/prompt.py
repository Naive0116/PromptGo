from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class PromptCreate(BaseModel):
    raw_text: str
    role_definition: Optional[str] = None
    task_description: Optional[str] = None
    constraints: List[str] = []
    output_format: Optional[str] = None
    examples: List[str] = []
    tags: List[str] = []


class PromptUpdate(BaseModel):
    raw_text: Optional[str] = None
    role_definition: Optional[str] = None
    task_description: Optional[str] = None
    constraints: Optional[List[str]] = None
    output_format: Optional[str] = None
    tags: Optional[List[str]] = None


class PromptResponse(BaseModel):
    id: str
    conversation_id: Optional[str] = None
    raw_text: str
    role_definition: Optional[str] = None
    task_description: Optional[str] = None
    constraints: List[str] = []
    output_format: Optional[str] = None
    examples: List[str] = []
    tags: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

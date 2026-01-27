from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime


class LLMConfig(BaseModel):
    """前端传递的LLM配置"""
    llm_provider: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    model: Optional[str] = None
    max_turns: Optional[int] = 5
    prompt_framework: Optional[str] = "standard"  # standard, langgpt, costar, structured


class ConversationCreate(BaseModel):
    initial_idea: str
    config: Optional[LLMConfig] = None


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class PromptInConversation(BaseModel):
    id: str
    raw_text: str
    role_definition: Optional[str] = None
    task_description: Optional[str] = None
    constraints: List[str] = []
    output_format: Optional[str] = None
    tags: List[str] = []

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: str
    initial_idea: str
    status: str
    current_turn: int
    max_turns: int
    created_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_int(cls, obj):
        return cls(
            id=obj.id,
            initial_idea=obj.initial_idea,
            status=obj.status.value if hasattr(obj.status, 'value') else obj.status,
            current_turn=int(obj.current_turn),
            max_turns=int(obj.max_turns),
            created_at=obj.created_at
        )


class ConversationDetailResponse(BaseModel):
    id: str
    initial_idea: str
    status: str
    current_turn: int
    max_turns: int
    created_at: datetime
    messages: List[MessageResponse] = []
    prompt: Optional[PromptInConversation] = None

    class Config:
        from_attributes = True


class QuestionOption(BaseModel):
    label: str
    value: str


class QuestionResponse(BaseModel):
    type: str = "question"
    question: str
    options: List[QuestionOption] = []
    allow_custom: bool = True
    hint: Optional[str] = None
    current_understanding: Optional[str] = None
    current_turn: int
    max_turns: int


class GeneratedPromptResponse(BaseModel):
    type: str = "prompt"
    prompt: Dict[str, Any]
    raw_text: str
    tags: List[str] = []


class ConversationStartResponse(BaseModel):
    conversation_id: str
    status: str
    current_turn: int
    max_turns: int
    response: Dict[str, Any]


class ConversationMessageResponse(BaseModel):
    status: str
    current_turn: int
    max_turns: int
    response: Dict[str, Any]

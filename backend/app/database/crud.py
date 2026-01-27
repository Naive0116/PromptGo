from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional, List
import uuid

from ..models.conversation import Conversation, Message, ConversationStatus
from ..models.prompt import Prompt


class ConversationCRUD:
    @staticmethod
    async def create(
        db: AsyncSession,
        initial_idea: str,
        max_turns: int = 5,
        llm_provider: str = None,
        base_url: str = None,
        api_key: str = None,
        llm_model: str = None,
        prompt_framework: str = "standard"
    ) -> Conversation:
        conversation = Conversation(
            id=str(uuid.uuid4()),
            initial_idea=initial_idea,
            max_turns=str(max_turns),
            current_turn="1",
            llm_provider=llm_provider,
            base_url=base_url,
            api_key=api_key,
            llm_model=llm_model,
            prompt_framework=prompt_framework
        )
        db.add(conversation)
        await db.flush()
        return conversation

    @staticmethod
    async def get_by_id(db: AsyncSession, conversation_id: str) -> Optional[Conversation]:
        result = await db.execute(
            select(Conversation)
            .options(selectinload(Conversation.messages), selectinload(Conversation.prompt))
            .where(Conversation.id == conversation_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all(db: AsyncSession, limit: int = 50, offset: int = 0) -> List[Conversation]:
        result = await db.execute(
            select(Conversation)
            .order_by(Conversation.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    @staticmethod
    async def update_turn(db: AsyncSession, conversation: Conversation, turn: int) -> Conversation:
        conversation.current_turn = str(turn)
        await db.flush()
        return conversation

    @staticmethod
    async def complete(db: AsyncSession, conversation: Conversation) -> Conversation:
        conversation.status = ConversationStatus.COMPLETED
        await db.flush()
        return conversation

    @staticmethod
    async def delete(db: AsyncSession, conversation: Conversation) -> None:
        await db.delete(conversation)
        await db.flush()


class MessageCRUD:
    @staticmethod
    async def create(db: AsyncSession, conversation_id: str, role: str, content: str) -> Message:
        message = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        db.add(message)
        await db.flush()
        return message

    @staticmethod
    async def get_by_conversation(db: AsyncSession, conversation_id: str) -> List[Message]:
        result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        )
        return list(result.scalars().all())


class PromptCRUD:
    @staticmethod
    async def create(
        db: AsyncSession,
        conversation_id: str,
        raw_text: str,
        role_definition: str = None,
        task_description: str = None,
        constraints: List[str] = None,
        output_format: str = None,
        examples: List[str] = None,
        tags: List[str] = None
    ) -> Prompt:
        prompt = Prompt(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            raw_text=raw_text,
            role_definition=role_definition,
            task_description=task_description,
            constraints=constraints or [],
            output_format=output_format,
            examples=examples or [],
            tags=tags or []
        )
        db.add(prompt)
        await db.flush()
        return prompt

    @staticmethod
    async def get_by_id(db: AsyncSession, prompt_id: str) -> Optional[Prompt]:
        result = await db.execute(
            select(Prompt).where(Prompt.id == prompt_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all(db: AsyncSession, limit: int = 50, offset: int = 0) -> List[Prompt]:
        result = await db.execute(
            select(Prompt)
            .order_by(Prompt.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    @staticmethod
    async def update(
        db: AsyncSession,
        prompt: Prompt,
        raw_text: str = None,
        role_definition: str = None,
        task_description: str = None,
        constraints: List[str] = None,
        output_format: str = None,
        tags: List[str] = None
    ) -> Prompt:
        if raw_text is not None:
            prompt.raw_text = raw_text
        if role_definition is not None:
            prompt.role_definition = role_definition
        if task_description is not None:
            prompt.task_description = task_description
        if constraints is not None:
            prompt.constraints = constraints
        if output_format is not None:
            prompt.output_format = output_format
        if tags is not None:
            prompt.tags = tags
        await db.flush()
        return prompt

    @staticmethod
    async def delete(db: AsyncSession, prompt: Prompt) -> None:
        await db.delete(prompt)
        await db.flush()

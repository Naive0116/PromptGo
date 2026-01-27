from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from ..database.db import Base


class ConversationStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    initial_idea = Column(Text, nullable=False)
    status = Column(SQLEnum(ConversationStatus), default=ConversationStatus.IN_PROGRESS)
    current_turn = Column(String(10), default="1")
    max_turns = Column(String(10), default="5")
    llm_provider = Column(String(50), nullable=True)
    base_url = Column(Text, nullable=True)
    api_key = Column(Text, nullable=True)
    llm_model = Column(String(100), nullable=True)
    prompt_framework = Column(String(50), default="standard")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    prompt = relationship("Prompt", back_populates="conversation", uselist=False, cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False)
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")

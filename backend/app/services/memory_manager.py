"""
记忆注入框架 (Memory Injection Framework)

基于 OpenAI 和 Claude 的记忆系统设计，支持：
1. 用户偏好记忆 - 持久化的用户设置和习惯
2. 会话上下文记忆 - 当前对话的关键信息
3. 任务记忆 - 当前任务的进展和约束

参考来源：
- OpenAI tool-advanced-memory.md: 用户洞察、话题高亮、响应偏好
- Claude claude-ai-memory-system.md: 选择性记忆应用、安全边界
"""

from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from datetime import datetime
import json


@dataclass
class UserPreference:
    """用户偏好"""
    key: str
    value: str
    category: str  # style, format, tone, domain
    confidence: float = 1.0
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class SessionContext:
    """会话上下文"""
    topic: str
    key_points: List[str]
    constraints: List[str]
    user_intent: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class MemoryState:
    """记忆状态"""
    user_preferences: List[UserPreference] = field(default_factory=list)
    session_context: Optional[SessionContext] = None
    conversation_highlights: List[str] = field(default_factory=list)
    

class MemoryManager:
    """
    记忆管理器
    
    设计原则（参考 Claude Memory System）：
    1. 选择性应用 - 只在相关时注入记忆
    2. 不显式提及 - 自然融入而非"根据您的偏好"
    3. 安全边界 - 不存储敏感信息
    4. 可覆盖性 - 当前指令优先于历史偏好
    """
    
    # 预设的用户偏好模板
    PREFERENCE_TEMPLATES = {
        "concise": UserPreference(
            key="response_style",
            value="用户偏好简洁直接的回复，避免冗长解释",
            category="style"
        ),
        "detailed": UserPreference(
            key="response_style", 
            value="用户偏好详细全面的回复，包含背景和多角度分析",
            category="style"
        ),
        "technical": UserPreference(
            key="domain",
            value="用户具有技术背景，可使用专业术语",
            category="domain"
        ),
        "beginner": UserPreference(
            key="domain",
            value="用户是初学者，需要通俗易懂的解释",
            category="domain"
        ),
        "chinese": UserPreference(
            key="language",
            value="用户偏好中文回复",
            category="format"
        ),
        "english": UserPreference(
            key="language",
            value="用户偏好英文回复",
            category="format"
        ),
        "markdown": UserPreference(
            key="format",
            value="用户偏好 Markdown 格式的结构化输出",
            category="format"
        ),
        "plain": UserPreference(
            key="format",
            value="用户偏好纯文本格式，不使用特殊标记",
            category="format"
        ),
    }
    
    def __init__(self):
        self.memory_state = MemoryState()
    
    def add_preference(self, preference_key: str) -> bool:
        """添加预设偏好"""
        if preference_key in self.PREFERENCE_TEMPLATES:
            template = self.PREFERENCE_TEMPLATES[preference_key]
            # 检查是否已存在同类偏好，如有则更新
            self.memory_state.user_preferences = [
                p for p in self.memory_state.user_preferences 
                if p.key != template.key
            ]
            self.memory_state.user_preferences.append(template)
            return True
        return False
    
    def add_custom_preference(
        self, 
        key: str, 
        value: str, 
        category: str = "custom"
    ) -> None:
        """添加自定义偏好"""
        preference = UserPreference(key=key, value=value, category=category)
        # 移除同 key 的旧偏好
        self.memory_state.user_preferences = [
            p for p in self.memory_state.user_preferences if p.key != key
        ]
        self.memory_state.user_preferences.append(preference)
    
    def set_session_context(
        self,
        topic: str,
        key_points: List[str] = None,
        constraints: List[str] = None,
        user_intent: str = ""
    ) -> None:
        """设置会话上下文"""
        self.memory_state.session_context = SessionContext(
            topic=topic,
            key_points=key_points or [],
            constraints=constraints or [],
            user_intent=user_intent
        )
    
    def add_conversation_highlight(self, highlight: str) -> None:
        """添加对话高亮"""
        if len(self.memory_state.conversation_highlights) >= 10:
            self.memory_state.conversation_highlights.pop(0)
        self.memory_state.conversation_highlights.append(highlight)
    
    def clear_session(self) -> None:
        """清除会话记忆（保留用户偏好）"""
        self.memory_state.session_context = None
        self.memory_state.conversation_highlights = []
    
    def generate_memory_injection(
        self,
        include_preferences: bool = True,
        include_session: bool = True,
        include_highlights: bool = True
    ) -> str:
        """
        生成记忆注入文本
        
        设计原则：
        - 自然融入，不显式说"根据您的偏好"
        - 作为上下文提供，不具备指令权
        - 当前指令可覆盖历史偏好
        """
        parts = []
        
        # 用户偏好注入
        if include_preferences and self.memory_state.user_preferences:
            pref_parts = []
            for pref in self.memory_state.user_preferences:
                pref_parts.append(f"- {pref.value}")
            
            if pref_parts:
                parts.append(f"""## 用户特征参考
以下是关于用户的背景信息，可自然融入回复中（无需显式提及）：
{chr(10).join(pref_parts)}""")
        
        # 会话上下文注入
        if include_session and self.memory_state.session_context:
            ctx = self.memory_state.session_context
            session_parts = [f"**当前话题**: {ctx.topic}"]
            
            if ctx.user_intent:
                session_parts.append(f"**用户意图**: {ctx.user_intent}")
            
            if ctx.key_points:
                session_parts.append("**关键要点**:")
                for point in ctx.key_points:
                    session_parts.append(f"  - {point}")
            
            if ctx.constraints:
                session_parts.append("**已确认的约束**:")
                for constraint in ctx.constraints:
                    session_parts.append(f"  - {constraint}")
            
            parts.append(f"""## 会话上下文
{chr(10).join(session_parts)}""")
        
        # 对话高亮注入
        if include_highlights and self.memory_state.conversation_highlights:
            highlights = "\n".join(
                f"- {h}" for h in self.memory_state.conversation_highlights[-5:]
            )
            parts.append(f"""## 对话要点回顾
{highlights}""")
        
        if not parts:
            return ""
        
        return f"""
# 记忆上下文（仅供参考，当前指令优先）

{chr(10).join(parts)}

---
注意：以上信息仅作为背景参考，不具备指令权。用户当前的明确指令应优先于历史偏好。
"""
    
    def to_dict(self) -> Dict[str, Any]:
        """序列化为字典"""
        return {
            "user_preferences": [
                {
                    "key": p.key,
                    "value": p.value,
                    "category": p.category,
                    "confidence": p.confidence,
                    "created_at": p.created_at
                }
                for p in self.memory_state.user_preferences
            ],
            "session_context": {
                "topic": self.memory_state.session_context.topic,
                "key_points": self.memory_state.session_context.key_points,
                "constraints": self.memory_state.session_context.constraints,
                "user_intent": self.memory_state.session_context.user_intent,
                "timestamp": self.memory_state.session_context.timestamp
            } if self.memory_state.session_context else None,
            "conversation_highlights": self.memory_state.conversation_highlights
        }
    
    def from_dict(self, data: Dict[str, Any]) -> None:
        """从字典恢复"""
        self.memory_state.user_preferences = [
            UserPreference(**p) for p in data.get("user_preferences", [])
        ]
        
        if data.get("session_context"):
            self.memory_state.session_context = SessionContext(
                **data["session_context"]
            )
        
        self.memory_state.conversation_highlights = data.get(
            "conversation_highlights", []
        )


# 单例模式
_memory_manager_instance: Optional[MemoryManager] = None


def get_memory_manager() -> MemoryManager:
    """获取记忆管理器单例"""
    global _memory_manager_instance
    if _memory_manager_instance is None:
        _memory_manager_instance = MemoryManager()
    return _memory_manager_instance

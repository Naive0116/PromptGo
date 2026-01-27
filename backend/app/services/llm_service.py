from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import json

from anthropic import AsyncAnthropic

from ..config import get_settings


class LLMProvider(ABC):
    @abstractmethod
    async def chat(
        self,
        messages: List[Dict[str, str]],
        system: str = None,
        max_tokens: int = 4096,
        temperature: float = 0.7
    ) -> str:
        pass


class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str, model: str):
        self.client = AsyncAnthropic(api_key=api_key)
        self.model = model

    async def chat(
        self,
        messages: List[Dict[str, str]],
        system: str = None,
        max_tokens: int = 4096,
        temperature: float = 0.7
    ) -> str:
        kwargs = {
            "model": self.model,
            "max_tokens": max_tokens,
            "messages": messages,
            "temperature": temperature
        }
        if system:
            kwargs["system"] = system

        response = await self.client.messages.create(**kwargs)
        return response.content[0].text


class DeepSeekProvider(LLMProvider):
    """DeepSeek API (OpenAI compatible)"""
    def __init__(self, api_key: str, model: str = "deepseek-chat", base_url: str = None):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url or "https://api.deepseek.com/v1"

    async def chat(
        self,
        messages: List[Dict[str, str]],
        system: str = None,
        max_tokens: int = 4096,
        temperature: float = 0.7
    ) -> str:
        import httpx

        if system:
            messages = [{"role": "system", "content": system}] + messages

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature
                },
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]


class QwenProvider(LLMProvider):
    """Qwen/Tongyi API (OpenAI compatible)"""
    def __init__(self, api_key: str, model: str = "qwen-turbo", base_url: str = None):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url or "https://dashscope.aliyuncs.com/compatible-mode/v1"

    async def chat(
        self,
        messages: List[Dict[str, str]],
        system: str = None,
        max_tokens: int = 4096,
        temperature: float = 0.7
    ) -> str:
        import httpx

        if system:
            messages = [{"role": "system", "content": system}] + messages

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature
                },
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]


class OpenAICompatibleProvider(LLMProvider):
    """通用 OpenAI 兼容接口（用于代理/自定义接口）"""
    def __init__(self, api_key: str, model: str, base_url: str):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip('/')

    async def chat(
        self,
        messages: List[Dict[str, str]],
        system: str = None,
        max_tokens: int = 4096,
        temperature: float = 0.7
    ) -> str:
        import httpx

        if system:
            messages = [{"role": "system", "content": system}] + messages

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature
                },
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]


def get_llm_provider(
    provider_name: str = None,
    api_key: str = None,
    model: str = None,
    base_url: str = None
) -> LLMProvider:
    """
    获取LLM提供商实例，支持动态配置
    
    Args:
        provider_name: 提供商名称，优先使用传入值，否则使用环境变量
        api_key: API密钥，优先使用传入值，否则使用环境变量
        model: 模型名称，优先使用传入值，否则使用环境变量
        base_url: 自定义API地址，用于代理或兼容接口
    """
    settings = get_settings()
    
    provider = provider_name or settings.llm_provider
    final_model = model or settings.llm_model

    if api_key:
        final_api_key = api_key
    else:
        api_key_map = {
            "anthropic": settings.anthropic_api_key,
            "deepseek": settings.deepseek_api_key or settings.anthropic_api_key,
            "qwen": settings.qwen_api_key or settings.anthropic_api_key,
            "openai": settings.anthropic_api_key,
            "custom": settings.anthropic_api_key,
        }
        final_api_key = api_key_map.get(provider, settings.anthropic_api_key)

    if not final_api_key:
        raise ValueError(
            f"Missing API key for provider '{provider}'. "
            f"Set API key in backend/.env or provide via settings."
        )

    # 如果提供了 base_url，使用通用 OpenAI 兼容接口
    if base_url:
        return OpenAICompatibleProvider(final_api_key, final_model, base_url)

    # 如果是 custom 类型但没有 base_url，报错
    if provider == "custom":
        raise ValueError("Custom provider requires a base_url")

    providers = {
        "anthropic": lambda: AnthropicProvider(final_api_key, final_model),
        "deepseek": lambda: DeepSeekProvider(final_api_key, final_model),
        "qwen": lambda: QwenProvider(final_api_key, final_model),
        "openai": lambda: OpenAICompatibleProvider(final_api_key, final_model, "https://api.openai.com/v1"),
    }

    if provider not in providers:
        raise ValueError(f"Unknown LLM provider: {provider}. Supported: anthropic, deepseek, qwen, openai, custom")

    return providers[provider]()

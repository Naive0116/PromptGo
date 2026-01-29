"""
技能文件加载器 (Skill Loader)

基于顶级 AI 系统（Claude、GPT-5、Gemini）的技能文件设计模式，
为每个场景加载专属的最佳实践和决策边界。
"""

import os
import re
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass


@dataclass
class SkillConfig:
    """技能配置数据类"""
    name: str
    identity: str
    must_do: List[str]
    must_not: List[str]
    prefer: List[str]
    output_format: str
    verbosity_guide: Dict[str, str]
    forbidden_phrases: List[str]
    good_examples: List[Dict[str, str]]
    bad_examples: List[Dict[str, str]]
    verification_checklist: List[str]
    raw_content: str


class SkillLoader:
    """
    技能文件加载器
    
    设计灵感来源：
    - Claude Works 的 Skills 系统
    - GPT-5 的 /home/oai/skills/ 目录
    - Gemini 的 Tool Usage Rules
    """
    
    SKILLS_DIR = Path(__file__).parent.parent / "config" / "skills"
    
    # 场景到技能文件的映射
    SCENARIO_SKILL_MAP = {
        "coding": "coding_assistant.md",
        "writing": "writing_tutor.md",
        "analysis": "data_analyst.md",
        "creative": "creative_writer.md",
        "customer_service": "customer_service.md",
        "general": None,  # 通用场景不需要特定技能
        "auto": None,     # 自动模式会根据意图选择
    }
    
    def __init__(self):
        self._cache: Dict[str, SkillConfig] = {}
    
    def load_skill(self, scenario: str) -> Optional[SkillConfig]:
        """
        加载指定场景的技能文件
        
        Args:
            scenario: 场景标识符
            
        Returns:
            SkillConfig 或 None（如果场景没有对应技能文件）
        """
        if scenario in self._cache:
            return self._cache[scenario]
        
        skill_file = self.SCENARIO_SKILL_MAP.get(scenario)
        if not skill_file:
            return None
        
        skill_path = self.SKILLS_DIR / skill_file
        if not skill_path.exists():
            return None
        
        with open(skill_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        skill_config = self._parse_skill_file(content, scenario)
        self._cache[scenario] = skill_config
        return skill_config
    
    def _parse_skill_file(self, content: str, name: str) -> SkillConfig:
        """解析技能文件内容"""
        
        # 提取核心身份
        identity = self._extract_section(content, "核心身份", "## ")
        
        # 提取决策边界
        must_do = self._extract_list(content, "MUST_DO")
        must_not = self._extract_list(content, "MUST_NOT")
        prefer = self._extract_list(content, "PREFER")
        
        # 提取输出格式
        output_format = self._extract_section(content, "输出格式规范", "## ")
        
        # 提取冗余度指南
        verbosity_guide = self._extract_verbosity_guide(content)
        
        # 提取禁止短语
        forbidden_phrases = self._extract_list(content, "禁止短语")
        
        # 提取示例
        good_examples = self._extract_examples(content, "Good Example")
        bad_examples = self._extract_examples(content, "Bad Example")
        
        # 提取验证清单
        verification_checklist = self._extract_checklist(content)
        
        return SkillConfig(
            name=name,
            identity=identity,
            must_do=must_do,
            must_not=must_not,
            prefer=prefer,
            output_format=output_format,
            verbosity_guide=verbosity_guide,
            forbidden_phrases=forbidden_phrases,
            good_examples=good_examples,
            bad_examples=bad_examples,
            verification_checklist=verification_checklist,
            raw_content=content
        )
    
    def _extract_section(self, content: str, header: str, delimiter: str = "## ") -> str:
        """提取指定标题下的内容"""
        pattern = rf"{delimiter}{header}\s*\n(.*?)(?={delimiter}|\Z)"
        match = re.search(pattern, content, re.DOTALL)
        return match.group(1).strip() if match else ""
    
    def _extract_list(self, content: str, section_name: str) -> List[str]:
        """提取列表项"""
        pattern = rf"###\s*{section_name}.*?\n(.*?)(?=###|\Z)"
        match = re.search(pattern, content, re.DOTALL)
        if not match:
            # 尝试另一种格式
            pattern = rf"##\s*{section_name}.*?\n(.*?)(?=##|\Z)"
            match = re.search(pattern, content, re.DOTALL)
        
        if not match:
            return []
        
        text = match.group(1)
        items = re.findall(r'^[-*]\s*(.+)$', text, re.MULTILINE)
        return [item.strip() for item in items if item.strip()]
    
    def _extract_verbosity_guide(self, content: str) -> Dict[str, str]:
        """提取冗余度指南"""
        guide = {}
        pattern = r'\|\s*(\d+-\d+)\s*\|\s*(.+?)\s*\|'
        matches = re.findall(pattern, content)
        for level, description in matches:
            guide[level] = description.strip()
        return guide
    
    def _extract_examples(self, content: str, example_type: str) -> List[Dict[str, str]]:
        """提取示例对话"""
        examples = []
        pattern = rf"###\s*{example_type}\s*\n(.*?)(?=###|\Z)"
        matches = re.finditer(pattern, content, re.DOTALL)
        
        for match in matches:
            example_text = match.group(1)
            user_match = re.search(r'\*\*User:\*\*\s*(.+?)(?=\*\*|$)', example_text, re.DOTALL)
            response_match = re.search(rf'\*\*(?:Good|Bad) Response:\*\*\s*(.+?)(?=###|\Z)', example_text, re.DOTALL)
            
            if user_match and response_match:
                examples.append({
                    "user": user_match.group(1).strip(),
                    "response": response_match.group(1).strip()
                })
        
        return examples
    
    def _extract_checklist(self, content: str) -> List[str]:
        """提取验证检查清单"""
        pattern = r'\[\s*\]\s*(.+)'
        matches = re.findall(pattern, content)
        return [item.strip() for item in matches]
    
    def get_available_skills(self) -> List[str]:
        """获取所有可用的技能列表"""
        if not self.SKILLS_DIR.exists():
            return []
        
        skills = []
        for file in self.SKILLS_DIR.glob("*.md"):
            skills.append(file.stem)
        return skills
    
    def generate_skill_injection(self, scenario: str, verbosity: int = 5) -> str:
        """
        生成技能注入文本，用于增强提示词
        
        Args:
            scenario: 场景标识符
            verbosity: 冗余度级别 (1-10)
            
        Returns:
            格式化的技能注入文本
        """
        skill = self.load_skill(scenario)
        if not skill:
            return ""
        
        # 确定冗余度级别描述
        verbosity_desc = ""
        for level_range, desc in skill.verbosity_guide.items():
            start, end = map(int, level_range.split('-'))
            if start <= verbosity <= end:
                verbosity_desc = desc
                break
        
        injection = f"""
<skill_context>
## 角色定位
{skill.identity}

## 决策边界

### 必须执行 (MUST_DO)
{self._format_list(skill.must_do)}

### 禁止执行 (MUST_NOT)
{self._format_list(skill.must_not)}

### 偏好 (PREFER)
{self._format_list(skill.prefer)}

## 输出风格
冗余度级别: {verbosity}/10
风格要求: {verbosity_desc}

## 禁止短语
以下短语绝不使用:
{self._format_list(skill.forbidden_phrases)}

## 验证清单
完成任务前，确保:
{self._format_list(skill.verification_checklist)}
</skill_context>
"""
        return injection.strip()
    
    def _format_list(self, items: List[str]) -> str:
        """格式化列表为 Markdown"""
        if not items:
            return "- (无)"
        return "\n".join(f"- {item}" for item in items)


# 单例实例
_skill_loader_instance: Optional[SkillLoader] = None


def get_skill_loader() -> SkillLoader:
    """获取技能加载器单例"""
    global _skill_loader_instance
    if _skill_loader_instance is None:
        _skill_loader_instance = SkillLoader()
    return _skill_loader_instance

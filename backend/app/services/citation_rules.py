"""
引用规范系统 (Citation Rules System)

基于 Claude 和 GPT 的引用规范设计，支持：
1. 输出格式规范 - 结构化的输出要求
2. 引用格式规则 - 信息来源标注
3. 版权合规提示 - 避免直接复制受版权保护的内容

参考来源：
- Claude claude-4.5-sonnet.md: 严格引用规则、内联引用格式
- Claude claude-sonnet-4.md: 版权合规、搜索策略
- GPT gpt-5-thinking.md: 事实准确性、网络搜索引用
"""

from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from enum import Enum


class CitationStyle(Enum):
    """引用风格"""
    INLINE = "inline"           # 内联引用 [来源]
    FOOTNOTE = "footnote"       # 脚注引用
    ACADEMIC = "academic"       # 学术引用 (Author, Year)
    URL = "url"                 # URL 直接引用
    NONE = "none"               # 无引用要求


class OutputFormat(Enum):
    """输出格式"""
    MARKDOWN = "markdown"
    PLAIN_TEXT = "plain_text"
    JSON = "json"
    XML = "xml"
    CODE = "code"


@dataclass
class CitationRule:
    """引用规则配置"""
    style: CitationStyle = CitationStyle.INLINE
    require_sources: bool = False
    max_direct_quote_length: int = 100  # 最大直接引用长度
    paraphrase_preference: bool = True  # 优先改写而非直接引用
    copyright_warning: bool = True      # 版权提醒
    fact_check_reminder: bool = True    # 事实核查提醒


@dataclass  
class OutputRule:
    """输出规则配置"""
    format: OutputFormat = OutputFormat.MARKDOWN
    max_length: Optional[int] = None
    include_summary: bool = False
    include_steps: bool = False
    code_language: Optional[str] = None
    structured_sections: List[str] = None


class CitationRulesManager:
    """
    引用规范管理器
    
    核心功能：
    1. 生成引用格式指令
    2. 生成输出结构指令
    3. 生成版权合规提醒
    4. 生成事实核查提醒
    """
    
    # 预设的引用规则模板
    CITATION_PRESETS = {
        "strict": CitationRule(
            style=CitationStyle.INLINE,
            require_sources=True,
            max_direct_quote_length=50,
            paraphrase_preference=True,
            copyright_warning=True,
            fact_check_reminder=True
        ),
        "academic": CitationRule(
            style=CitationStyle.ACADEMIC,
            require_sources=True,
            max_direct_quote_length=100,
            paraphrase_preference=True,
            copyright_warning=True,
            fact_check_reminder=True
        ),
        "casual": CitationRule(
            style=CitationStyle.NONE,
            require_sources=False,
            max_direct_quote_length=200,
            paraphrase_preference=False,
            copyright_warning=False,
            fact_check_reminder=False
        ),
        "creative": CitationRule(
            style=CitationStyle.NONE,
            require_sources=False,
            max_direct_quote_length=0,
            paraphrase_preference=False,
            copyright_warning=False,
            fact_check_reminder=False
        ),
    }
    
    # 预设的输出规则模板
    OUTPUT_PRESETS = {
        "standard": OutputRule(
            format=OutputFormat.MARKDOWN,
            include_summary=False,
            include_steps=False
        ),
        "detailed": OutputRule(
            format=OutputFormat.MARKDOWN,
            include_summary=True,
            include_steps=True
        ),
        "code": OutputRule(
            format=OutputFormat.CODE,
            include_summary=False,
            include_steps=False
        ),
        "structured": OutputRule(
            format=OutputFormat.MARKDOWN,
            include_summary=True,
            include_steps=True,
            structured_sections=["背景", "分析", "结论", "建议"]
        ),
    }
    
    def __init__(self):
        self.citation_rule = self.CITATION_PRESETS["casual"]
        self.output_rule = self.OUTPUT_PRESETS["standard"]
    
    def set_citation_preset(self, preset_name: str) -> bool:
        """设置引用规则预设"""
        if preset_name in self.CITATION_PRESETS:
            self.citation_rule = self.CITATION_PRESETS[preset_name]
            return True
        return False
    
    def set_output_preset(self, preset_name: str) -> bool:
        """设置输出规则预设"""
        if preset_name in self.OUTPUT_PRESETS:
            self.output_rule = self.OUTPUT_PRESETS[preset_name]
            return True
        return False
    
    def set_custom_citation(self, rule: CitationRule) -> None:
        """设置自定义引用规则"""
        self.citation_rule = rule
    
    def set_custom_output(self, rule: OutputRule) -> None:
        """设置自定义输出规则"""
        self.output_rule = rule
    
    def generate_citation_instruction(self) -> str:
        """
        生成引用格式指令
        
        参考 Claude 的引用规范：
        - 使用内联引用格式
        - 优先改写而非直接引用
        - 标注信息来源
        """
        if self.citation_rule.style == CitationStyle.NONE:
            return ""
        
        parts = ["## 引用规范"]
        
        # 引用风格
        style_instructions = {
            CitationStyle.INLINE: "使用内联引用格式，如 [来源名称] 或 [1]",
            CitationStyle.FOOTNOTE: "使用脚注引用格式，在文末列出所有引用来源",
            CitationStyle.ACADEMIC: "使用学术引用格式，如 (作者, 年份)",
            CitationStyle.URL: "直接提供 URL 链接作为引用来源",
        }
        parts.append(f"**引用格式**: {style_instructions.get(self.citation_rule.style, '')}")
        
        # 引用长度限制
        if self.citation_rule.max_direct_quote_length > 0:
            parts.append(f"**直接引用限制**: 单次直接引用不超过 {self.citation_rule.max_direct_quote_length} 字")
        
        # 改写偏好
        if self.citation_rule.paraphrase_preference:
            parts.append("**改写优先**: 优先使用自己的语言改写信息，而非直接复制原文")
        
        # 来源要求
        if self.citation_rule.require_sources:
            parts.append("**来源标注**: 所有非原创观点必须标注信息来源")
        
        return "\n".join(parts)
    
    def generate_copyright_warning(self) -> str:
        """
        生成版权合规提醒
        
        参考 Claude 的版权规范：
        - 不直接复制大段受版权保护的内容
        - 歌词、诗歌、书籍等需特别注意
        """
        if not self.citation_rule.copyright_warning:
            return ""
        
        return """## 版权合规
- 不要直接复制大段受版权保护的内容（如歌词、诗歌、书籍章节）
- 如需引用，请使用简短摘录并注明来源
- 对于代码，注意开源协议要求
- 如用户要求复制受版权保护的内容，请礼貌说明无法直接提供，但可以：
  - 提供内容摘要
  - 指引用户到官方来源
  - 提供类似的原创内容"""
    
    def generate_fact_check_reminder(self) -> str:
        """
        生成事实核查提醒
        
        参考 GPT-5 的准确性规范：
        - 对不确定的信息明确表示
        - 建议用户核实关键事实
        """
        if not self.citation_rule.fact_check_reminder:
            return ""
        
        return """## 事实准确性
- 对于不确定的信息，明确表示"我不确定"或"据我了解"
- 涉及数字、日期、专有名词时需格外谨慎
- 如果信息可能已过时，提醒用户核实最新情况
- 不要编造不存在的引用、研究或数据"""
    
    def generate_output_structure_instruction(self) -> str:
        """
        生成输出结构指令
        """
        parts = ["## 输出格式要求"]
        
        # 格式要求
        format_instructions = {
            OutputFormat.MARKDOWN: "使用 Markdown 格式，合理使用标题、列表、代码块",
            OutputFormat.PLAIN_TEXT: "使用纯文本格式，不使用特殊标记",
            OutputFormat.JSON: "输出为有效的 JSON 格式",
            OutputFormat.XML: "输出为有效的 XML 格式",
            OutputFormat.CODE: "主要输出代码，使用适当的代码块标记",
        }
        parts.append(f"**格式**: {format_instructions.get(self.output_rule.format, '')}")
        
        # 长度限制
        if self.output_rule.max_length:
            parts.append(f"**长度限制**: 回复不超过 {self.output_rule.max_length} 字")
        
        # 结构化章节
        if self.output_rule.structured_sections:
            sections = "、".join(self.output_rule.structured_sections)
            parts.append(f"**结构化章节**: 按以下顺序组织内容：{sections}")
        
        # 摘要要求
        if self.output_rule.include_summary:
            parts.append("**摘要**: 在回复开头提供简短摘要（2-3句话）")
        
        # 步骤要求
        if self.output_rule.include_steps:
            parts.append("**步骤化**: 对于操作性内容，使用编号步骤")
        
        # 代码语言
        if self.output_rule.code_language:
            parts.append(f"**代码语言**: 优先使用 {self.output_rule.code_language}")
        
        return "\n".join(parts)
    
    def generate_full_rules_injection(self) -> str:
        """
        生成完整的规则注入文本
        """
        parts = []
        
        citation_inst = self.generate_citation_instruction()
        if citation_inst:
            parts.append(citation_inst)
        
        copyright_warning = self.generate_copyright_warning()
        if copyright_warning:
            parts.append(copyright_warning)
        
        fact_check = self.generate_fact_check_reminder()
        if fact_check:
            parts.append(fact_check)
        
        output_inst = self.generate_output_structure_instruction()
        if output_inst:
            parts.append(output_inst)
        
        if not parts:
            return ""
        
        return "\n\n".join(parts)
    
    def get_scenario_rules(self, scenario: str) -> str:
        """
        根据场景获取推荐的规则配置
        """
        scenario_configs = {
            "code_assistant": {
                "citation": "casual",
                "output": "code"
            },
            "content_writer": {
                "citation": "strict",
                "output": "detailed"
            },
            "analyst": {
                "citation": "academic",
                "output": "structured"
            },
            "tutor": {
                "citation": "casual",
                "output": "detailed"
            },
            "customer_service": {
                "citation": "casual",
                "output": "standard"
            },
            "general": {
                "citation": "casual",
                "output": "standard"
            },
        }
        
        config = scenario_configs.get(scenario, scenario_configs["general"])
        self.set_citation_preset(config["citation"])
        self.set_output_preset(config["output"])
        
        return self.generate_full_rules_injection()


# 单例模式
_citation_rules_manager_instance: Optional[CitationRulesManager] = None


def get_citation_rules_manager() -> CitationRulesManager:
    """获取引用规范管理器单例"""
    global _citation_rules_manager_instance
    if _citation_rules_manager_instance is None:
        _citation_rules_manager_instance = CitationRulesManager()
    return _citation_rules_manager_instance

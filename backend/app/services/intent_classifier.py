"""
意图分类器 - 轻量级场景/人设/模板自动推断
基于关键词匹配 + 规则，延迟 < 100ms
"""
import json
import re
from typing import Dict, Any, Optional
from pathlib import Path


class IntentClassifier:
    """轻量级意图分类器"""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        初始化分类器
        
        Args:
            config_path: prompt_options.json 配置文件路径
        """
        if config_path is None:
            config_path = Path(__file__).parent.parent / "config" / "prompt_options.json"
        
        self.config = self._load_config(config_path)
        self._build_keyword_index()
    
    def _load_config(self, config_path) -> Dict[str, Any]:
        """加载配置文件"""
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"加载配置文件失败: {e}")
            return {"scenarios": [], "personalities": [], "templates": []}
    
    def _build_keyword_index(self):
        """构建关键词索引"""
        self.keyword_to_scenario = {}
        self.scenario_keywords = {}
        
        for scenario in self.config.get("scenarios", []):
            if scenario.get("is_auto"):
                continue
            
            scenario_id = scenario["id"]
            keywords = scenario.get("keywords", [])
            self.scenario_keywords[scenario_id] = keywords
            
            for keyword in keywords:
                if keyword not in self.keyword_to_scenario:
                    self.keyword_to_scenario[keyword] = []
                self.keyword_to_scenario[keyword].append(scenario_id)
    
    def classify(self, user_input: str) -> Dict[str, Any]:
        """
        对用户输入进行意图分类
        
        Args:
            user_input: 用户输入文本
        
        Returns:
            {
                "scenario": "code_assistant",
                "personality": "efficient",
                "template": "structured",
                "confidence": 0.85,
                "matched_keywords": ["代码", "函数"]
            }
        """
        if not user_input:
            return self._get_default_result()
        
        # 统计每个场景的关键词匹配数
        scenario_scores = {}
        matched_keywords = {}
        
        input_lower = user_input.lower()
        
        for keyword, scenarios in self.keyword_to_scenario.items():
            if keyword in input_lower:
                for scenario_id in scenarios:
                    if scenario_id not in scenario_scores:
                        scenario_scores[scenario_id] = 0
                        matched_keywords[scenario_id] = []
                    scenario_scores[scenario_id] += 1
                    matched_keywords[scenario_id].append(keyword)
        
        if not scenario_scores:
            return self._get_default_result()
        
        # 找到得分最高的场景
        best_scenario = max(scenario_scores, key=scenario_scores.get)
        best_score = scenario_scores[best_scenario]
        total_keywords = len(self.scenario_keywords.get(best_scenario, []))
        
        # 计算置信度（匹配关键词数 / 总关键词数，最高 0.95）
        confidence = min(0.95, best_score / max(total_keywords, 1) * 2)
        
        # 如果置信度太低，返回通用场景
        if confidence < 0.3:
            return self._get_default_result()
        
        # 获取推荐的人设和模板
        scenario_config = self._get_scenario_config(best_scenario)
        
        return {
            "scenario": best_scenario,
            "personality": scenario_config.get("recommended_personality"),
            "template": scenario_config.get("recommended_template", "standard"),
            "confidence": round(confidence, 2),
            "matched_keywords": matched_keywords.get(best_scenario, [])
        }
    
    def _get_scenario_config(self, scenario_id: str) -> Dict[str, Any]:
        """获取场景配置"""
        for scenario in self.config.get("scenarios", []):
            if scenario["id"] == scenario_id:
                return scenario
        return {}
    
    def _get_default_result(self) -> Dict[str, Any]:
        """返回默认结果（通用场景）"""
        general_config = self._get_scenario_config("general")
        return {
            "scenario": "general",
            "personality": general_config.get("recommended_personality"),
            "template": general_config.get("recommended_template", "standard"),
            "confidence": 0.0,
            "matched_keywords": []
        }
    
    def get_all_scenarios(self) -> list:
        """获取所有场景列表"""
        return self.config.get("scenarios", [])
    
    def get_all_personalities(self) -> list:
        """获取所有人设列表"""
        return self.config.get("personalities", [])
    
    def get_all_templates(self) -> list:
        """获取所有模板列表"""
        return self.config.get("templates", [])
    
    def get_compatibility_matrix(self) -> Dict[str, list]:
        """获取场景-人设兼容矩阵"""
        return self.config.get("compatibility_matrix", {})


# 全局分类器实例
_classifier: Optional[IntentClassifier] = None


def get_intent_classifier() -> IntentClassifier:
    """获取意图分类器单例"""
    global _classifier
    if _classifier is None:
        _classifier = IntentClassifier()
    return _classifier

from typing import Dict, Any, List


class PromptGenerator:
    @staticmethod
    def format_structured_prompt(prompt_data: Dict[str, Any]) -> str:
        parts = []

        if prompt_data.get("role"):
            parts.append(f"# 角色\n{prompt_data['role']}")

        if prompt_data.get("task"):
            parts.append(f"# 任务\n{prompt_data['task']}")

        if prompt_data.get("constraints"):
            constraints_text = "\n".join(f"- {c}" for c in prompt_data["constraints"])
            parts.append(f"# 约束条件\n{constraints_text}")

        if prompt_data.get("output_format"):
            parts.append(f"# 输出格式\n{prompt_data['output_format']}")

        if prompt_data.get("examples"):
            examples_text = "\n\n".join(prompt_data["examples"])
            parts.append(f"# 示例\n{examples_text}")

        return "\n\n".join(parts)

    @staticmethod
    def parse_raw_prompt(raw_text: str) -> Dict[str, Any]:
        result = {
            "role": None,
            "task": None,
            "constraints": [],
            "output_format": None,
            "examples": []
        }

        sections = raw_text.split("#")
        for section in sections:
            section = section.strip()
            if not section:
                continue

            lines = section.split("\n", 1)
            if len(lines) < 2:
                continue

            header = lines[0].strip().lower()
            content = lines[1].strip()

            if "角色" in header or "role" in header:
                result["role"] = content
            elif "任务" in header or "task" in header:
                result["task"] = content
            elif "约束" in header or "constraint" in header:
                constraints = [
                    line.strip().lstrip("-").strip()
                    for line in content.split("\n")
                    if line.strip()
                ]
                result["constraints"] = constraints
            elif "输出" in header or "format" in header or "output" in header:
                result["output_format"] = content
            elif "示例" in header or "example" in header:
                result["examples"] = [content]

        return result

from __future__ import annotations

from typing import Any

from app.agents.training_assistant.config import TrainingAssistantConfig
from app.agents.training_assistant.mcp_client import AgentMCPClient
from app.agents.training_assistant.planner import TrainingAssistantPlanner
from app.agents.training_assistant.response_formatter import TrainingAssistantResponseFormatter
from app.agents.training_assistant.tool_registration import TrainingAssistantToolRegistry


class TrainingAssistantRuntime:
    """Modular runtime for the training assistant agent."""

    def __init__(self, config: TrainingAssistantConfig | None = None) -> None:
        self.config = config or TrainingAssistantConfig()
        self.mcp_client = AgentMCPClient(server_url=self.config.mcp_server_url)
        self.tool_registry = TrainingAssistantToolRegistry(self.mcp_client)
        self.planner = TrainingAssistantPlanner()
        self.formatter = TrainingAssistantResponseFormatter()

    def start(self) -> None:
        self.mcp_client.connect()

    def stop(self) -> None:
        self.mcp_client.disconnect()

    def handle(self, prompt: str) -> dict[str, Any]:
        self.start()
        plan = self.planner.plan(prompt)
        tool_name = plan["tool"]
        tool_result = self.tool_registry.invoke(tool_name, plan.get("arguments", {}))
        if tool_name == "create_event" and tool_result.get("title") is None:
            tool_result["title"] = plan.get("arguments", {}).get("title", "Workshop")
        response = self.formatter.format(prompt, plan, tool_result)
        self.stop()
        return {
            "agent": self.config.name,
            "prompt": prompt,
            "plan": plan,
            "response": response,
            "status": "ready",
        }

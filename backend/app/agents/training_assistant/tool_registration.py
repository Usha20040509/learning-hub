from __future__ import annotations

from typing import Any

from app.agents.training_assistant.mcp_client import AgentMCPClient


class TrainingAssistantToolRegistry:
    """Registers the MCP tools this agent is allowed to use."""

    def __init__(self, mcp_client: AgentMCPClient) -> None:
        self.mcp_client = mcp_client

    def list_tools(self) -> list[str]:
        return ["search_training_catalog", "search_events", "get_user_schedule"]

    def invoke(self, tool_name: str, arguments: dict[str, Any] | None = None) -> dict[str, Any]:
        return self.mcp_client.call_tool(tool_name, arguments or {})

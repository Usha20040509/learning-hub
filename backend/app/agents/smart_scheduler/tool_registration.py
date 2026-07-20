from __future__ import annotations

from typing import Any

from app.agents.smart_scheduler.mcp_client import AgentMCPClient


class SmartSchedulerToolRegistry:
    """Registers the MCP tools this agent is allowed to use."""

    def __init__(self, mcp_client: AgentMCPClient) -> None:
        self.mcp_client = mcp_client

    def list_tools(self) -> list[str]:
        return ["get_user_schedule", "get_team_schedule", "find_free_slots", "create_event"]

    def invoke(self, tool_name: str, arguments: dict[str, Any] | None = None) -> dict[str, Any]:
        return self.mcp_client.call_tool(tool_name, arguments or {})

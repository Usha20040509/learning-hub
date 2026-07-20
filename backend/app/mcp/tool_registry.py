from __future__ import annotations

from typing import Callable

from app.mcp.tools.events import register_event_tools
from app.mcp.tools.training_catalog import register_training_catalog_tools
from app.mcp.tools.schedule import register_schedule_tools


def register_all_tools(server: object) -> None:
    """Register all MCP tools with the provided FastMCP server instance."""
    register_event_tools(server)
    register_training_catalog_tools(server)
    register_schedule_tools(server)

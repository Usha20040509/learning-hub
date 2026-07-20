from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(slots=False)
class AgentMCPClient:
    """Placeholder MCP client for the smart scheduler agent."""

    server_url: str | None = None

    def __post_init__(self) -> None:
        self.connected = False

    def connect(self) -> None:
        self.connected = True

    def disconnect(self) -> None:
        self.connected = False

    def call_tool(self, name: str, arguments: dict[str, Any] | None = None) -> dict[str, Any]:
        if not self.connected:
            raise RuntimeError("MCP client is not connected")
        return {"tool": name, "arguments": arguments or {}, "status": "placeholder"}

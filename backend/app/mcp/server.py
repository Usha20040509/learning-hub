from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from app.mcp.tool_registry import register_all_tools

server = FastMCP("Learning Hub MCP Server")
register_all_tools(server)


if __name__ == "__main__":
    server.run()

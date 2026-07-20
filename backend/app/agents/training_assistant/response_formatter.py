from __future__ import annotations

from typing import Any


class TrainingAssistantResponseFormatter:
    """Formats MCP tool results into human-readable replies."""

    def format(self, prompt: str, plan: dict[str, Any], result: dict[str, Any]) -> str:
        intent = plan.get("intent", "general")
        if intent == "list_personal_training_sessions":
            items = result.get("items", [])
            if not items:
                return "You do not have any sessions scheduled for tomorrow."
            joined = ", ".join(item.get("title") or "Unnamed session" for item in items[:5])
            return f"You have these sessions tomorrow: {joined}."

        if intent == "find_event_attendees":
            items = result.get("items", [])
            if not items:
                return "I could not find an event matching that request."
            first = items[0]
            return f"The event '{first.get('title')}' is scheduled for {first.get('start_time')}."

        if intent == "find_upcoming_workshops":
            items = result.get("items", [])
            if not items:
                return "I did not find any upcoming workshops in the catalog."
            joined = ", ".join(item.get("title") or "Unnamed workshop" for item in items[:5])
            return f"Here are some upcoming workshops: {joined}."

        if intent == "create_workshop_event":
            title = result.get("title") or "Workshop"
            return f"I created a workshop event titled '{title}'."

        if result.get("items"):
            first = result["items"][0]
            if isinstance(first, dict):
                title = first.get("title") or first.get("name") or "item"
                return f"I found: {title}."

        return "I did not find enough information to answer that request yet."

from __future__ import annotations

import re
from typing import Any


class TrainingAssistantPlanner:
    """Maps user intent to MCP tools and arguments without hardcoded replies."""

    def plan(self, prompt: str) -> dict[str, Any]:
        text = (prompt or "").strip().lower()

        if re.search(r"what trainings|training(s)? do i have|tomorrow", text):
            return {
                "tool": "get_user_schedule",
                "arguments": {"employee_id": 1, "start_date": self._next_day_iso(), "end_date": self._next_day_iso()},
                "intent": "list_personal_training_sessions",
            }

        if re.search(r"who is attending|attending", text):
            return {
                "tool": "search_events",
                "arguments": {"query": self._extract_training_name(text), "status": "scheduled"},
                "intent": "find_event_attendees",
            }

        if re.search(r"upcoming ai workshops|upcoming .*workshop|show .*workshop", text):
            return {
                "tool": "search_training_catalog",
                "arguments": {"query": "workshop", "category": "workshop"},
                "intent": "find_upcoming_workshops",
            }

        if re.search(r"create .*workshop|schedule .*workshop|next friday", text):
            return {
                "tool": "create_event",
                "arguments": {
                    "title": self._extract_workshop_title(text),
                    "start_time": self._next_friday_iso(),
                    "end_time": self._next_friday_end_iso(),
                    "organizer_id": 1,
                    "description": "Workshop created by the training assistant",
                    "status": "scheduled",
                },
                "intent": "create_workshop_event",
            }

        return {
            "tool": "search_training_catalog",
            "arguments": {"query": text, "category": None},
            "intent": "search_training_catalog",
        }

    def _extract_training_name(self, text: str) -> str:
        match = re.search(r"attending\s+(.+?)\??$", text)
        return match.group(1).strip() if match else ""

    def _extract_workshop_title(self, text: str) -> str:
        match = re.search(r"create\s+(.+?)\s+workshop", text)
        if match:
            return match.group(1).strip().title()
        return "Prompt Engineering Workshop"

    def _next_day_iso(self) -> str:
        from datetime import datetime, timedelta

        return (datetime.utcnow() + timedelta(days=1)).date().isoformat()

    def _next_friday_iso(self) -> str:
        from datetime import datetime, timedelta

        today = datetime.utcnow().date()
        days_until_friday = (4 - today.weekday()) % 7
        if days_until_friday == 0:
            days_until_friday = 7
        friday = today + timedelta(days=days_until_friday)
        return datetime.combine(friday, datetime.min.time()).isoformat()

    def _next_friday_end_iso(self) -> str:
        from datetime import datetime, timedelta

        today = datetime.utcnow().date()
        days_until_friday = (4 - today.weekday()) % 7
        if days_until_friday == 0:
            days_until_friday = 7
        friday = today + timedelta(days=days_until_friday)
        return datetime.combine(friday + timedelta(hours=1), datetime.min.time()).isoformat()

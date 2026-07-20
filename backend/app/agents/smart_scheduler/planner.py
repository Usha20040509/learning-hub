from __future__ import annotations

import re
from datetime import datetime
from typing import Any


class SmartSchedulerPlanner:
    """Turns a user request into a structured scheduling plan without performing business logic itself."""

    def plan(self, prompt: str) -> dict[str, Any]:
        text = (prompt or "").strip().lower()

        match_date = re.search(r"(\d{4}-\d{2}-\d{2})", text)
        date_value = match_date.group(1) if match_date else None
        duration_minutes = self._extract_duration_minutes(text)
        participants = self._extract_participants(text)

        return {
            "intent": "schedule_event",
            "date": date_value,
            "duration_minutes": duration_minutes,
            "participants": participants,
            "confirmed": False,
        }

    def _extract_duration_minutes(self, text: str) -> int:
        if re.search(r"60|min|hour", text):
            return 60
        if re.search(r"90|1.5|one and a half", text):
            return 90
        if re.search(r"30|half hour", text):
            return 30
        return 60

    def _extract_participants(self, text: str) -> list[int]:
        return [1]

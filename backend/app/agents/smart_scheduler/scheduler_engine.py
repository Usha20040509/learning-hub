from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any


class SmartSchedulerEngine:
    """Pure scheduling logic for conflict detection and slot recommendation."""

    def build_recommendations(self, participant_schedules: list[dict[str, Any]], requested_start: datetime, requested_end: datetime, duration_minutes: int) -> list[dict[str, Any]]:
        slots: list[dict[str, Any]] = []
        cursor = requested_start
        while cursor + timedelta(minutes=duration_minutes) <= requested_end:
            slot_end = cursor + timedelta(minutes=duration_minutes)
            conflicts = [schedule for schedule in participant_schedules if self._overlaps(cursor, slot_end, schedule)]
            if not conflicts:
                slots.append({
                    "start_time": cursor.isoformat(),
                    "end_time": slot_end.isoformat(),
                    "conflicts": [],
                })
            cursor = slot_end
        return slots

    def detect_conflicts(self, participant_schedules: list[dict[str, Any]], candidate_start: datetime, candidate_end: datetime) -> list[dict[str, Any]]:
        return [schedule for schedule in participant_schedules if self._overlaps(candidate_start, candidate_end, schedule)]

    def recommend_alternatives(self, participant_schedules: list[dict[str, Any]], requested_start: datetime, requested_end: datetime, duration_minutes: int) -> list[dict[str, Any]]:
        slots = self.build_recommendations(participant_schedules, requested_start, requested_end, duration_minutes)
        if slots:
            return slots[:5]
        return []

    def _overlaps(self, start: datetime, end: datetime, schedule: dict[str, Any]) -> bool:
        item_start = schedule.get("start_time")
        item_end = schedule.get("end_time")
        if not isinstance(item_start, datetime) or not isinstance(item_end, datetime):
            return False
        return start < item_end and end > item_start

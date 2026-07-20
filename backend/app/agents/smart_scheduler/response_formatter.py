from __future__ import annotations

from typing import Any


class SmartSchedulerResponseFormatter:
    """Formats scheduling results into a natural-language response."""

    def format(self, plan: dict[str, Any], recommendations: list[dict[str, Any]], conflicts: list[dict[str, Any]], created: dict[str, Any] | None = None) -> str:
        if created:
            return f"The event was created for {created.get('title', 'your requested session')}."

        if not recommendations:
            return "I could not find any suitable free slots for the requested time window."

        formatted = ", ".join(
            f"{slot['start_time']} to {slot['end_time']}" for slot in recommendations[:3]
        )
        return f"Here are the best available options: {formatted}."

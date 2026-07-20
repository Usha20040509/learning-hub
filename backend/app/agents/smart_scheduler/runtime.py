from __future__ import annotations

from datetime import datetime
from typing import Any

from app.agents.smart_scheduler.config import SmartSchedulerConfig
from app.agents.smart_scheduler.mcp_client import AgentMCPClient
from app.agents.smart_scheduler.planner import SmartSchedulerPlanner
from app.agents.smart_scheduler.response_formatter import SmartSchedulerResponseFormatter
from app.agents.smart_scheduler.scheduler_engine import SmartSchedulerEngine
from app.agents.smart_scheduler.tool_registration import SmartSchedulerToolRegistry


class SmartSchedulerRuntime:
    """Modular runtime for the smart scheduler agent."""

    def __init__(self, config: SmartSchedulerConfig | None = None) -> None:
        self.config = config or SmartSchedulerConfig()
        self.mcp_client = AgentMCPClient(server_url=self.config.mcp_server_url)
        self.tool_registry = SmartSchedulerToolRegistry(self.mcp_client)
        self.planner = SmartSchedulerPlanner()
        self.engine = SmartSchedulerEngine()
        self.formatter = SmartSchedulerResponseFormatter()

    def start(self) -> None:
        self.mcp_client.connect()

    def stop(self) -> None:
        self.mcp_client.disconnect()

    def handle(self, prompt: str) -> dict[str, Any]:
        self.start()
        plan = self.planner.plan(prompt)
        participant_schedules = self._gather_participant_schedules(plan)
        requested_start = datetime.fromisoformat(plan["date"]) if plan.get("date") else datetime.utcnow()
        requested_end = requested_start + self._duration_delta(plan.get("duration_minutes", 60))
        conflicts = self.engine.detect_conflicts(participant_schedules, requested_start, requested_end)
        recommendations = self.engine.recommend_alternatives(participant_schedules, requested_start, requested_end, plan.get("duration_minutes", 60))
        created = None
        if plan.get("confirmed"):
            created = self.tool_registry.invoke("create_event", {
                "title": "Scheduled Session",
                "start_time": requested_start.isoformat(),
                "end_time": requested_end.isoformat(),
                "organizer_id": 1,
                "status": "scheduled",
            })
        response = self.formatter.format(plan, recommendations, conflicts, created)
        self.stop()
        return {
            "agent": self.config.name,
            "prompt": prompt,
            "plan": plan,
            "conflicts": conflicts,
            "recommendations": recommendations,
            "response": response,
            "status": "ready",
        }

    def _gather_participant_schedules(self, plan: dict[str, Any]) -> list[dict[str, Any]]:
        schedules: list[dict[str, Any]] = []
        for participant_id in plan.get("participants", []):
            result = self.tool_registry.invoke("get_user_schedule", {"employee_id": participant_id})
            items = result.get("items", [])
            schedules.extend(items)
        return schedules

    def _duration_delta(self, duration_minutes: int) -> Any:
        from datetime import timedelta

        return timedelta(minutes=duration_minutes)

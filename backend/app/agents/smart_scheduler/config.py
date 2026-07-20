from dataclasses import dataclass


@dataclass(slots=True)
class SmartSchedulerConfig:
    name: str = "smart_scheduler"
    description: str = "Finds free availability and drafts schedules for employees and teams"
    model_provider: str = "placeholder"
    mcp_server_url: str | None = None

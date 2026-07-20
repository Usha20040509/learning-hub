from dataclasses import dataclass


@dataclass(slots=True)
class TrainingAssistantConfig:
    name: str = "training_assistant"
    description: str = "Helps employees discover training content and upcoming sessions"
    model_provider: str = "placeholder"
    mcp_server_url: str | None = None

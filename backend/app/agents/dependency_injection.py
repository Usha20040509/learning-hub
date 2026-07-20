from __future__ import annotations

from app.agents.smart_scheduler.config import SmartSchedulerConfig
from app.agents.smart_scheduler.runtime import SmartSchedulerRuntime
from app.agents.training_assistant.config import TrainingAssistantConfig
from app.agents.training_assistant.runtime import TrainingAssistantRuntime


def build_training_assistant() -> TrainingAssistantRuntime:
    return TrainingAssistantRuntime(TrainingAssistantConfig())


def build_smart_scheduler() -> SmartSchedulerRuntime:
    return SmartSchedulerRuntime(SmartSchedulerConfig())

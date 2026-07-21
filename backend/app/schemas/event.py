from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class EventCreate(BaseModel):
    title: str
    description: str | None = None
    start_time: datetime
    end_time: datetime
    location: str | None = None
    status: str = "scheduled"
    training_catalog_id: int | None = None
    organizer_id: int
    meeting_link: str | None = None          # optional — no meeting link = no Join button
    assignment_included: bool = False
    invited_employee_ids: list[int] = Field(default_factory=list)
    invited_team_ids: list[int] = Field(default_factory=list)
    is_recurring: bool = False
    recurrence_until: datetime | None = None
    # Days of the week to repeat on: 0=Monday … 6=Sunday (ISO weekday - 1).
    # Empty list means every day (backwards-compatible with old "daily" behaviour).
    recurrence_days: list[int] = Field(default_factory=list)
    ignore_clashes: bool = False

    @model_validator(mode="after")
    def validate_event_schedule(self) -> "EventCreate":
        if self.end_time <= self.start_time:
            raise ValueError("End time must be after start time")
        if self.is_recurring and self.recurrence_until and self.recurrence_until.date() < self.start_time.date():
            raise ValueError("Recurrence end date must be on or after start date")
        if self.recurrence_days:
            for day in self.recurrence_days:
                if day not in range(7):
                    raise ValueError("recurrence_days values must be integers 0–6 (Mon–Sun)")
        return self


class EventRead(EventCreate):
    id: int
    series_id: str | None = None
    organizer_name: str | None = None
    invited_employee_names: list[str] = Field(default_factory=list)
    invited_team_names: list[str] = Field(default_factory=list)

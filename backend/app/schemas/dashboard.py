from datetime import datetime

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    upcoming_sessions: list[dict]
    todays_sessions: list[dict]
    next_session: dict | None = None
    recent_events: list[dict]
    assignments: list[dict] = []
    recent_activities: list[dict] = []


class CalendarEvent(BaseModel):
    id: int
    title: str
    start_time: datetime
    end_time: datetime
    location: str | None = None
    status: str
    event_type: str
    organizer_name: str | None = None
    meeting_link: str | None = None
    description: str | None = None
    invited_count: int = 0
    participants: list[str] = []
    teams_invited: list[str] = []
    assignment_included: bool = False


class CalendarResponse(BaseModel):
    events: list[CalendarEvent]
    view: str
    start_date: datetime
    end_date: datetime


class MySessionItem(BaseModel):
    id: int
    title: str
    start_time: datetime
    end_time: datetime
    status: str
    event_type: str
    organizer_name: str | None = None
    location: str | None = None
    meeting_link: str | None = None
    description: str | None = None
    invited_count: int = 0
    participants: list[str] = []
    teams_invited: list[str] = []
    assignment_included: bool = False


class MySessionsResponse(BaseModel):
    todays_sessions: list[MySessionItem]
    upcoming_sessions: list[MySessionItem]
    completed_sessions: list[MySessionItem]


class LeaderboardItem(BaseModel):
    employee: str
    attendance: str       # percentage string e.g. "87%"
    sessions_attended: int
    total_sessions: int
    assignments: int


class DashboardLeaderboardResponse(BaseModel):
    leaderboard: list[LeaderboardItem]

from pydantic import BaseModel, ConfigDict


class TeamCreate(BaseModel):
    team_code: str
    name: str
    description: str | None = None
    is_active: bool = True


class TeamRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    team_code: str
    name: str
    description: str | None = None
    is_active: bool = True
    member_count: int = 0

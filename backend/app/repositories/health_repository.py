from sqlalchemy.orm import Session


class HealthRepository:
    def __init__(self, db: Session | None = None) -> None:
        self.db = db

    def get_status(self) -> str:
        _ = self.db
        return "ok"

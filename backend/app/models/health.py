from sqlalchemy import Column, Integer, String

from app.database.base import Base


class HealthCheck(Base):
    __tablename__ = "health_checks"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String(50), nullable=False, default="ok")

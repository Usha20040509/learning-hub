from __future__ import annotations

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.event import Event


class TrainingCatalog(Base):
    __tablename__ = "training_catalog"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    duration_hours: Mapped[int | None] = mapped_column(nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False, default=lambda: __import__("datetime").datetime.utcnow())
    updated_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False, default=lambda: __import__("datetime").datetime.utcnow(), onupdate=lambda: __import__("datetime").datetime.utcnow())

    events: Mapped[list["Event"]] = relationship(back_populates="catalog_item")

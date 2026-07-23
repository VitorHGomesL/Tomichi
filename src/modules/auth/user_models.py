from datetime import UTC, datetime

from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database.session import Base
from src.modules.tasks.tasks_models import Task

class User(Base):
    __tablename__ = "users"

    user_id: Mapped[UUID] = mapped_column(Integer, primary_key=True, index=True)

    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)

    password_hash: Mapped[str] = mapped_column(
        String(200), 
        nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda:datetime.now(UTC),
    )

    tasks: Mapped[list[Task]] = relationship(
        back_populates="author", 
        cascade="all, delete-orphan"
        )      
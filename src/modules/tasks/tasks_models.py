from src.database.session import Base
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.modules.auth.user_models import User

from datetime import datetime, UTC

class Task(Base):
    __tablename__ = "tasks"

    task_id: Mapped[UUID] = mapped_column(UUID, primary_key=True, index=True)

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.user_id"),
        nullable=False,
        index=True
    )

    title: Mapped[str] = mapped_column(String(100), nullable=False)

    content: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda:datetime.now(UTC),
    )

    due_date:Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda:datetime.now(UTC),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda:datetime.now(UTC),
    )

    author: Mapped[User] = relationship(back_populates="tasks")

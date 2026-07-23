from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID

class TaskBase(BaseModel):
    title: str = Field(
        ...,
        min_length=2,
        max_length=100
    )
    content: str = Field(
        ...,
        min_length=5,
        max_length=500
    )

class TaskCreate(TaskBase):
    due_date: datetime | None = None

class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    due_date: datetime | None
    updated_at: datetime | None

class TaskUpdate(TaskBase):
    title: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )
    content: str | None = Field(
        default= None,
        min_length=5,
        max_length=500
    )


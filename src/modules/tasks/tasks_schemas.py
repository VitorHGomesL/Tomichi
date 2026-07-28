from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from src.modules.auth.user_schemas import UserResponse

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
    task_id: int #TEMPORARY
    user_id: int #TEMPORARY
    created_at: datetime
    due_date: datetime | None
    updated_at: datetime | None
    author: UserResponse

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

    due_date: datetime | None

class TaskUpdateResponse(TaskUpdate):
    updated_at: datetime | None
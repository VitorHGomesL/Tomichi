from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)

    first_name: str = Field(..., min_length=3, max_length=30)

    last_name: str = Field(..., min_length=3, max_length=50)

    email: EmailStr = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=3, max_length=50)


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    created_at: datetime

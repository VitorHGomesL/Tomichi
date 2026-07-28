from pydantic import BaseModel, ConfigDict, Field, EmailStr

from datetime import datetime

class UserBase(BaseModel):
    username: str = Field(
        ..., 
        min_length=3, 
        max_length=50)
    
    nome: str = Field(
        ..., 
        min_length=3, 
        max_length=30)
    
    sobrenome: str = Field(
        ..., 
        min_length=3, 
        max_length=50)

    email: EmailStr = Field(
        ..., 
        min_length=3, 
        max_length=50)

class UserCreate(UserBase):
    password: str = Field(..., min_length=3, max_length=50)


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    created_at: datetime

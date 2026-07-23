from pydantic import BaseModel, ConfigDict, Field, EmailStr
from uuid import UUID

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
    #hashed_password: str = Field(..., min_length=3, max_length=50)
    pass

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime

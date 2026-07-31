from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)

class UserLogin(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=50)        

class UserCreate(UserBase):
    first_name: str = Field(..., min_length=3, max_length=30)
    last_name: str = Field(..., min_length=3, max_length=50)    
    password: str = Field(..., min_length=8, max_length=50)



class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    created_at: datetime
    first_name: str = Field(..., min_length=3, max_length=30)
    username: str = Field(..., min_length=3, max_length=50)

class UserPrivate(UserPublic):
    email: EmailStr = Field(..., min_length=3, max_length=50)
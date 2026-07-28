from fastapi import APIRouter, Depends, HTTPException, status
import src.modules.auth.user_models as models

from typing import Annotated
from src.modules.auth.user_schemas import UserResponse
from sqlalchemy import select
from sqlalchemy.orm import Session
from src.database.session import get_db

tests_router = APIRouter(prefix="/tests", tags=["Tests"])

@tests_router.get("/getallusers",response_model=list[UserResponse])
async def get_users(db:Annotated[Session, Depends(get_db)]):
    result = db.execute(
        select(models.User)
    )
    user = result.scalars().all()

    if user:
        return user
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")


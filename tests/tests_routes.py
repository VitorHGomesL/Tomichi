from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.database.session import get_db
from src.modules.auth.user_models import User
from src.modules.auth.user_schemas import UserResponse

tests_router = APIRouter(prefix="/tests", tags=["Tests"])


@tests_router.get("/getallusers", response_model=list[UserResponse])
async def get_users(db: Annotated[Session, Depends(get_db)]):
    result = db.execute(select(User))
    users = result.scalars().all()

    if users:
        return users
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

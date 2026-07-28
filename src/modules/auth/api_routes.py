from fastapi import APIRouter, Depends, HTTPException, status

from src.modules.auth.user_schemas import UserResponse, UserCreate

from src.database.session import get_db
import src.modules.auth.user_models as models

from typing import Annotated

from sqlalchemy import select
from sqlalchemy.orm import Session

api_auth_router = APIRouter(prefix="/api/v1/auth", tags=["auth API"])


@api_auth_router.post("/registrar", response_model=UserResponse)
async def create_user(user: UserCreate, db:Annotated[Session, Depends(get_db)]):
    result = db.execute(
        select(models.User).where(models.User.username == user.username)
    )
    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username Already exists"
        )

    result = db.execute(
        select(models.User).where(models.User.email == user.email)
    )
    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email Already exists"
        )

    new_user = models.User(
        username=user.username,
        nome=user.nome,
        sobrenome=user.sobrenome,
        email=user.email,
        password=user.password
    )

    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user
    

@api_auth_router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db:Annotated[Session, Depends(get_db)]):
    result = db.execute(
        select(models.User).where(models.User.user_id== user_id)
    )
    user = result.scalars().first()

    if user:
        return user
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")


from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.database.session import get_db
from src.modules.auth.user_models import User
from src.modules.auth.user_schemas import UserCreate, UserLogin, UserResponse
from src.security.password import hash_password, verify_password


api_auth_router = APIRouter(prefix="/api/v1/auth", tags=["auth API"])


@api_auth_router.post("/registrar", response_model=UserResponse)
async def create_user(user: UserCreate, db: Annotated[Session, Depends(get_db)]):
    result = db.execute(
        select(User).where(User.username == user.username)
    )
    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username Already exists",
        )

    result = db.execute(
        select(User).where(User.email == user.email)
    )
    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email Already exists",
        )

    new_user = User(
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password_hash=hash_password(user.password),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@api_auth_router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Annotated[Session, Depends(get_db)]):
    result = db.execute(
        select(User).where(User.user_id == user_id)
    )
    user = result.scalars().first()

    if user:
        return user
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

@api_auth_router.post("/login", response_model=UserResponse)
def UserNameLogin(user: UserLogin, db: Annotated[Session, Depends(get_db)]):
    result = db.execute(
        select(User).where(User.username == user.username)
    )
    UserInDB = result.scalars().first()

    if not UserInDB:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
       
    correct_password = verify_password(user.password, UserInDB.password_hash)

    if correct_password:
        print("Função funcional!!!")
        return UserInDB
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password",
    )

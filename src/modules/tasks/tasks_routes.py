from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.database.session import get_db
from src.modules.auth.user_models import User
from src.modules.tasks.tasks_models import Task
from src.modules.tasks.tasks_schemas import TaskCreate, TaskResponse

tasks_router = APIRouter(tags=["Tasks"])


@tasks_router.get("/{user_id}/tasks", response_model=list[TaskResponse])
async def get_user_tasks(user_id: int, db: Annotated[Session, Depends(get_db)]):
    result = db.execute(
        select(User).where(User.user_id == user_id)
    )
    user = result.scalars().first()

    tasks = user.tasks

    return tasks


@tasks_router.post("/{user_id}/create_task", response_model=TaskResponse)
def create_task(task: TaskCreate, user_id: int, db: Annotated[Session, Depends(get_db)]):
    result = db.execute(
        select(User).where(User.user_id == user_id)
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    new_task = Task(
        title=task.title,
        content=task.content,
        due_date=task.due_date,
        user_id=user_id,
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task

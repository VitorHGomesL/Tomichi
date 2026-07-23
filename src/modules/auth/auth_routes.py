from fastapi import APIRouter, Request, Form

from fastapi.templating import Jinja2Templates
from src.modules.auth.user_schemas import UserResponse, UserCreate
from src.database.db_tests import fake_db


auth_router = APIRouter(prefix="/auth", tags=["auth"])

templates = Jinja2Templates(directory="frontend/templates")

@auth_router.get("/registrar")
async def register_page(request: Request):
    return templates.TemplateResponse(request, "register.html")

@auth_router.post("/registrar", response_model=UserResponse)
async def register_inputs(user: UserCreate):

    new_id = max(u["id"] for u in fake_db) + 1 if fake_db else 1

    new_user = {
        "id": new_id,
        "username": user.username,
        "nome": user.nome,
        "sobrenome": user.sobrenome,
        "email": user.email,
        "created_at": "data_teste",
        "updated_at": "data_teste",
    }
    print(new_user)

    fake_db.append(new_user)
    return new_user
    
@auth_router.get("/login")
async def login_page(request: Request):
    return templates.TemplateResponse(request, "login.html")
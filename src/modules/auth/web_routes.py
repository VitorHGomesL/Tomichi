from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates

web_auth_router = APIRouter(tags=["auth webpages"])

templates = Jinja2Templates(directory="frontend/templates")


@web_auth_router.get("/registrar")
async def register_page(request: Request):
    return templates.TemplateResponse(request, "register.html")


@web_auth_router.get("/login")
async def login_page(request: Request):
    return templates.TemplateResponse(request, "login.html")


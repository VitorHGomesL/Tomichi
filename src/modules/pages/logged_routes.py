from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates

logged_router = APIRouter(prefix="/logged", tags=["logged"])

templates = Jinja2Templates(directory="frontend/templates")


@logged_router.get("/dashboard")
async def homepage(request: Request):
    return templates.TemplateResponse(request, "dashboard.html")

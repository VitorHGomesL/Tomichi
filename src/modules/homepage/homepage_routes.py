from fastapi import APIRouter, Request

from fastapi.templating import Jinja2Templates


homepage_router = APIRouter(prefix="/homepage", tags=["homepage"])

templates = Jinja2Templates(directory="frontend/templates")

@homepage_router.get("/")
async def homepage(request: Request):

    return templates.TemplateResponse(request, "homepage.html")
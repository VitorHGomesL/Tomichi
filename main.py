from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from src.database.connection import engine
from src.database.db_tests import fake_db_router
from src.database.session import Base
from src.modules.auth.api_routes import api_auth_router
from src.modules.auth.user_models import User  # noqa: F401
from src.modules.auth.web_routes import web_auth_router
from src.modules.pages.homepage_routes import homepage_router
from src.modules.tasks.tasks_models import Task  # noqa: F401
from src.modules.tasks.tasks_routes import tasks_router
from tests.tests_routes import tests_router
from src.modules.pages.logged_routes import logged_router


Base.metadata.create_all(bind=engine)

app = FastAPI()

app.mount("/static", StaticFiles(directory="frontend"), name="static")
app.mount("/media", StaticFiles(directory="media"), name="media")


@app.get("/")
async def root():
    """Redirect to the homepage."""
    return RedirectResponse(url="/homepage")


app.include_router(api_auth_router)
app.include_router(web_auth_router)
app.include_router(homepage_router)
app.include_router(tests_router)
app.include_router(tasks_router)
app.include_router(logged_router)

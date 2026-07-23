from fastapi import FastAPI, Request
from src.modules.auth.auth_routes import auth_router
from src.modules.homepage.homepage_routes import homepage_router
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates



app = FastAPI()

app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

templates = Jinja2Templates(directory="frontend/templates")

@app.get("/")
async def root():
    """
    Redirects to the homepage."""
    return RedirectResponse(url="/homepage")


app.include_router(auth_router)
app.include_router(homepage_router)


from src.database.db_tests import fake_db_router
app.include_router(fake_db_router)
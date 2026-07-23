fake_db = []


from fastapi import APIRouter

fake_db_router = APIRouter(prefix="/fake_db", tags=["fake_db"])

@fake_db_router.get("/")
def get_fake_db():
    return fake_db

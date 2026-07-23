from src.database.connection import engine

from sqlalchemy.orm import DeclarativeBase, sessionmaker

SessaoLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base (DeclarativeBase):
    pass

def get_db():
    with SessaoLocal() as db:
        yield db
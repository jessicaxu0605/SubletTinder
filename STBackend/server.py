from fastapi import FastAPI
from contextlib import asynccontextmanager
from db import init_db, close_db
from routes import listings, hello, renters, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB pool
    await init_db()
    yield
    # Shutdown: Close DB pool
    await close_db()

app = FastAPI(lifespan=lifespan)

app.include_router(listings.router)
app.include_router(auth.router)
app.include_router(hello.router)
app.include_router(renters.router)


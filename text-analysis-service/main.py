from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
import logging

from repository.config.database import engine
from repository.base import Base
from controller.analysis_controller import router as analysis_router
import repository.entities.text_analysis_entity
import repository.entities.analysis_token_entity

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Text Analysis Service",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware temporar
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.debug(f">>> {request.method} {request.url.path}")
    response = await call_next(request)
    logger.debug(f"<<< {response.status_code}")
    return response

app.include_router(analysis_router)
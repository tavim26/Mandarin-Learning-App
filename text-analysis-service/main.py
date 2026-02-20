from contextlib import asynccontextmanager
from fastapi import FastAPI

from config.database import engine, Base

from controller.analysis_controller import router as analysis_router


# forțează importul modelelor
import domain.text_analysis
import domain.analysis_token


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Text Analysis Service",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(analysis_router)
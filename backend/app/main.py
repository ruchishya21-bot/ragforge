from contextlib import asynccontextmanager

from fastapi import FastAPI

from backend.app.api.experiments import router as experiments_router
from backend.app.db.init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="RAGForge API",
    description="Enterprise RAG Evaluation and Benchmarking Platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(experiments_router)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ragforge-api",
        "version": "0.1.0",
    }
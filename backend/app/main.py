from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.chunks import router as chunks_router
from backend.app.api.datasets import router as datasets_router
from backend.app.api.documents import router as documents_router
from backend.app.api.embeddings import router as embeddings_router
from backend.app.api.evaluation import router as evaluation_router
from backend.app.api.experiments import router as experiments_router
from backend.app.api.rag import router as rag_router
from backend.app.api.retrieval import router as retrieval_router
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


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(experiments_router)
app.include_router(datasets_router)
app.include_router(documents_router)
app.include_router(chunks_router)
app.include_router(embeddings_router)
app.include_router(retrieval_router)
app.include_router(rag_router)
app.include_router(evaluation_router)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ragforge-api",
        "version": "0.1.0",
    }
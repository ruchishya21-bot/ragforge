from fastapi import FastAPI

app = FastAPI(
    title="RAGForge API",
    description="Enterprise RAG Evaluation and Benchmarking Platform",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ragforge-api",
        "version": "0.1.0",
    }
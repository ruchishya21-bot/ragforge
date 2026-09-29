from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.schemas import (
    RetrievalRequest,
    RetrievalResponse,
    RetrievalResult,
)
from backend.app.db.models import Chunk, Dataset, Document
from backend.app.db.session import AsyncSessionLocal
from backend.app.services.embeddings import embed_text


router = APIRouter(
    prefix="/retrieval",
    tags=["retrieval"],
)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


@router.post("/", response_model=RetrievalResponse)
async def retrieve_chunks(
    request: RetrievalRequest,
    db: AsyncSession = Depends(get_db),
):
    dataset = await db.get(Dataset, request.dataset_id)

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )

    query_vector = embed_text(request.query)

    distance = Chunk.embedding.cosine_distance(query_vector)

    statement = (
        select(Chunk, distance.label("distance"))
        .join(Document, Document.id == Chunk.document_id)
        .where(
            Document.dataset_id == request.dataset_id,
            Chunk.embedding.is_not(None),
        )
        .order_by(distance)
        .limit(request.top_k)
    )

    result = await db.execute(statement)

    rows = result.all()

    results = [
        RetrievalResult(
            chunk_id=chunk.id,
            document_id=chunk.document_id,
            content=chunk.content,
            chunk_index=chunk.chunk_index,
            similarity=1 - float(distance_value),
        )
        for chunk, distance_value in rows
    ]

    return RetrievalResponse(
        query=request.query,
        results=results,
    )
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.schemas import EmbeddingResponse
from backend.app.db.models import Chunk, Document
from backend.app.db.session import AsyncSessionLocal
from backend.app.services.embeddings import embed_texts


router = APIRouter(
    prefix="/embeddings",
    tags=["embeddings"],
)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


@router.post(
    "/documents/{document_id}",
    response_model=EmbeddingResponse,
)
async def generate_document_embeddings(
    document_id: int,
    db: AsyncSession = Depends(get_db),
):
    document = await db.get(Document, document_id)

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    result = await db.execute(
        select(Chunk)
        .where(Chunk.document_id == document_id)
        .order_by(Chunk.chunk_index)
    )

    chunks = result.scalars().all()

    if not chunks:
        raise HTTPException(
            status_code=400,
            detail="Document has no chunks. Generate chunks first.",
        )

    texts = [chunk.content for chunk in chunks]

    vectors = embed_texts(texts)

    for chunk, vector in zip(chunks, vectors):
        chunk.embedding = vector

    await db.commit()

    return EmbeddingResponse(
        document_id=document_id,
        embedded_chunks=len(chunks),
        embedding_dimensions=len(vectors[0]),
    )
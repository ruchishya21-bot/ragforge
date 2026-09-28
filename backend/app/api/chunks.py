from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.schemas import ChunkDocumentRequest, ChunkResponse
from backend.app.db.models import Chunk, Document
from backend.app.db.session import AsyncSessionLocal
from backend.app.services.chunking import chunk_text


router = APIRouter(
    prefix="/chunks",
    tags=["chunks"],
)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


@router.post(
    "/documents/{document_id}",
    response_model=list[ChunkResponse],
    status_code=201,
)
async def create_document_chunks(
    document_id: int,
    request: ChunkDocumentRequest,
    db: AsyncSession = Depends(get_db),
):
    document = await db.get(Document, document_id)

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    generated_chunks = chunk_text(
        text=document.content,
        chunk_size=request.chunk_size,
        overlap=request.overlap,
    )

    await db.execute(
        delete(Chunk).where(Chunk.document_id == document_id)
    )

    chunks = [
        Chunk(
            document_id=document_id,
            content=item["content"],
            chunk_index=item["chunk_index"],
            start_char=item["start_char"],
            end_char=item["end_char"],
        )
        for item in generated_chunks
    ]

    db.add_all(chunks)

    await db.commit()

    result = await db.execute(
        select(Chunk)
        .where(Chunk.document_id == document_id)
        .order_by(Chunk.chunk_index)
    )

    return result.scalars().all()


@router.get(
    "/documents/{document_id}",
    response_model=list[ChunkResponse],
)
async def list_document_chunks(
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

    return result.scalars().all()


@router.delete(
    "/documents/{document_id}",
    status_code=204,
)
async def delete_document_chunks(
    document_id: int,
    db: AsyncSession = Depends(get_db),
):
    document = await db.get(Document, document_id)

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    await db.execute(
        delete(Chunk).where(Chunk.document_id == document_id)
    )

    await db.commit()
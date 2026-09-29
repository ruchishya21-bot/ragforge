from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.schemas import RetrievalRequest, RetrievalResult
from backend.app.db.models import Chunk, Dataset, Document
from backend.app.db.session import AsyncSessionLocal
from backend.app.services.context import build_context
from backend.app.services.embeddings import embed_text
from backend.app.services.llm import generate_answer
from backend.app.services.rag import build_rag_prompt


router = APIRouter(
    prefix="/rag",
    tags=["rag"],
)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


@router.post("/")
async def ask_rag(
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

    retrieval_results = [
        RetrievalResult(
            chunk_id=chunk.id,
            document_id=chunk.document_id,
            content=chunk.content,
            chunk_index=chunk.chunk_index,
            similarity=1 - float(distance_value),
        )
        for chunk, distance_value in rows
    ]

    if not retrieval_results:
        raise HTTPException(
            status_code=404,
            detail="No embedded chunks found for this dataset",
        )

    context = build_context(retrieval_results)

    prompt = build_rag_prompt(
        query=request.query,
        context=context,
    )

    answer = await generate_answer(prompt)

    return {
        "query": request.query,
        "answer": answer,
        "sources": retrieval_results,
    }
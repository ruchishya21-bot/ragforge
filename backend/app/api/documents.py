from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.schemas import (
    DocumentCreate,
    DocumentResponse,
    DocumentUpdate,
)
from backend.app.db.models import Dataset, Document
from backend.app.db.session import AsyncSessionLocal


router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


@router.post("/", response_model=DocumentResponse, status_code=201)
async def create_document(
    document: DocumentCreate,
    db: AsyncSession = Depends(get_db),
):
    dataset = await db.get(Dataset, document.dataset_id)

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )

    new_document = Document(
        dataset_id=document.dataset_id,
        name=document.name,
        content=document.content,
        source=document.source,
    )

    db.add(new_document)
    await db.commit()
    await db.refresh(new_document)

    return new_document


@router.get("/", response_model=list[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).order_by(Document.id)
    )

    return result.scalars().all()


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
):
    document = await db.get(Document, document_id)

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    return document


@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    document_data: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
):
    document = await db.get(Document, document_id)

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    document.name = document_data.name
    document.content = document_data.content
    document.source = document_data.source

    await db.commit()
    await db.refresh(document)

    return document


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
):
    document = await db.get(Document, document_id)

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    await db.delete(document)
    await db.commit()
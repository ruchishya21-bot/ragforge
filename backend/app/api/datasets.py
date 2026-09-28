from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.schemas import (
    DatasetCreate,
    DatasetResponse,
    DatasetUpdate,
)
from backend.app.db.models import Dataset
from backend.app.db.session import AsyncSessionLocal


router = APIRouter(
    prefix="/datasets",
    tags=["datasets"],
)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


@router.post("/", response_model=DatasetResponse, status_code=201)
async def create_dataset(
    dataset: DatasetCreate,
    db: AsyncSession = Depends(get_db),
):
    new_dataset = Dataset(
        name=dataset.name,
        description=dataset.description,
    )

    db.add(new_dataset)
    await db.commit()
    await db.refresh(new_dataset)

    return new_dataset


@router.get("/", response_model=list[DatasetResponse])
async def list_datasets(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Dataset).order_by(Dataset.id)
    )

    return result.scalars().all()


@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
):
    dataset = await db.get(Dataset, dataset_id)

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )

    return dataset


@router.put("/{dataset_id}", response_model=DatasetResponse)
async def update_dataset(
    dataset_id: int,
    dataset_data: DatasetUpdate,
    db: AsyncSession = Depends(get_db),
):
    dataset = await db.get(Dataset, dataset_id)

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )

    dataset.name = dataset_data.name
    dataset.description = dataset_data.description

    await db.commit()
    await db.refresh(dataset)

    return dataset


@router.delete("/{dataset_id}", status_code=204)
async def delete_dataset(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
):
    dataset = await db.get(Dataset, dataset_id)

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )

    await db.delete(dataset)
    await db.commit()
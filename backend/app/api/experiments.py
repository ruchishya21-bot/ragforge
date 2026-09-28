from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.schemas import (
    ExperimentCreate,
    ExperimentResponse,
    ExperimentUpdate,
)
from backend.app.db.models import Experiment
from backend.app.db.session import AsyncSessionLocal


router = APIRouter(
    prefix="/experiments",
    tags=["experiments"],
)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


@router.post("/", response_model=ExperimentResponse, status_code=201)
async def create_experiment(
    experiment: ExperimentCreate,
    db: AsyncSession = Depends(get_db),
):
    new_experiment = Experiment(name=experiment.name)

    db.add(new_experiment)
    await db.commit()
    await db.refresh(new_experiment)

    return new_experiment


@router.get("/", response_model=list[ExperimentResponse])
async def list_experiments(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Experiment).order_by(Experiment.id)
    )

    return result.scalars().all()


@router.get("/{experiment_id}", response_model=ExperimentResponse)
async def get_experiment(
    experiment_id: int,
    db: AsyncSession = Depends(get_db),
):
    experiment = await db.get(Experiment, experiment_id)

    if experiment is None:
        raise HTTPException(
            status_code=404,
            detail="Experiment not found",
        )

    return experiment


@router.put("/{experiment_id}", response_model=ExperimentResponse)
async def update_experiment(
    experiment_id: int,
    experiment_data: ExperimentUpdate,
    db: AsyncSession = Depends(get_db),
):
    experiment = await db.get(Experiment, experiment_id)

    if experiment is None:
        raise HTTPException(
            status_code=404,
            detail="Experiment not found",
        )

    experiment.name = experiment_data.name

    await db.commit()
    await db.refresh(experiment)

    return experiment


@router.delete("/{experiment_id}", status_code=204)
async def delete_experiment(
    experiment_id: int,
    db: AsyncSession = Depends(get_db),
):
    experiment = await db.get(Experiment, experiment_id)

    if experiment is None:
        raise HTTPException(
            status_code=404,
            detail="Experiment not found",
        )

    await db.delete(experiment)
    await db.commit()
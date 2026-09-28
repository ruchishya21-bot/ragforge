from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ExperimentCreate(BaseModel):
    name: str


class ExperimentUpdate(BaseModel):
    name: str


class ExperimentResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class DatasetCreate(BaseModel):
    name: str
    description: str | None = None


class DatasetUpdate(BaseModel):
    name: str
    description: str | None = None


class DatasetResponse(BaseModel):
    id: int
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
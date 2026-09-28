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


class DocumentCreate(BaseModel):
    dataset_id: int
    name: str
    content: str
    source: str | None = None


class DocumentUpdate(BaseModel):
    name: str
    content: str
    source: str | None = None


class DocumentResponse(BaseModel):
    id: int
    dataset_id: int
    name: str
    content: str
    source: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


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


class ChunkResponse(BaseModel):
    id: int
    document_id: int
    content: str
    chunk_index: int
    start_char: int
    end_char: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChunkDocumentRequest(BaseModel):
    chunk_size: int = Field(default=500, gt=0)
    overlap: int = Field(default=50, ge=0)

    @model_validator(mode="after")
    def validate_overlap(self):
        if self.overlap >= self.chunk_size:
            raise ValueError("overlap must be smaller than chunk_size")

        return self
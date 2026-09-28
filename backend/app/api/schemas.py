from pydantic import BaseModel, ConfigDict


class ExperimentCreate(BaseModel):
    name: str


class ExperimentUpdate(BaseModel):
    name: str


class ExperimentResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)
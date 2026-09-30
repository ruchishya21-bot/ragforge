from sqlalchemy import text

from backend.app.db.base import Base
from backend.app.db.session import engine
from backend.app.db import models


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.execute(
            text("CREATE EXTENSION IF NOT EXISTS vector")
        )

        await conn.run_sync(
            Base.metadata.create_all
        )
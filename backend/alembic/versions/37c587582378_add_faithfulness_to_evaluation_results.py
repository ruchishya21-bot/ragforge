"""Add faithfulness to evaluation results

Revision ID: 37c587582378
Revises:
Create Date: 2026-09-28
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "37c587582378"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "evaluation_results",
        sa.Column(
            "faithfulness",
            sa.Double(),
            nullable=True,
        ),
    )

    op.execute(
        "UPDATE evaluation_results "
        "SET faithfulness = 0.0 "
        "WHERE faithfulness IS NULL"
    )

    op.alter_column(
        "evaluation_results",
        "faithfulness",
        nullable=False,
    )


def downgrade() -> None:
    op.drop_column(
        "evaluation_results",
        "faithfulness",
    )
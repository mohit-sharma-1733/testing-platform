"""Add new columns or modify existing ones

Revision ID: 3efe17cf71dc
Revises: 5079efcf2b3c
Create Date: 2024-11-15 13:49:16.672146

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3efe17cf71dc'
down_revision: Union[str, None] = '5079efcf2b3c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###

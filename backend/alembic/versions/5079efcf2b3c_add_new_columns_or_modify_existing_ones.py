"""Add new columns or modify existing ones

Revision ID: 5079efcf2b3c
Revises: d59be4fc9921
Create Date: 2024-11-15 13:45:42.663330

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5079efcf2b3c'
down_revision: Union[str, None] = 'd59be4fc9921'
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

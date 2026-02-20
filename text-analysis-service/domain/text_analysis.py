from datetime import datetime
from typing import List

from sqlalchemy import BigInteger, String, Text, Integer, TIMESTAMP, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from config.database import Base


class TextAnalysis(Base):
    __tablename__ = "text_analyses"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    student_id: Mapped[int] = mapped_column(BigInteger, nullable=False)

    raw_text: Mapped[str] = mapped_column(Text, nullable=False)

    source_type: Mapped[str] = mapped_column(String(20), nullable=False)

    overall_hsk_level: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        default=datetime.utcnow
    )

    tokens: Mapped[List["AnalysisToken"]] = relationship(
        "AnalysisToken",
        back_populates="analysis",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    __table_args__ = (
        Index("idx_student_created_at", "student_id", "created_at"),
    )

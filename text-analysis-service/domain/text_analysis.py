from datetime import datetime

from sqlalchemy import BigInteger, Text, String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from config.database import Base


class TextAnalysis(Base):
    __tablename__ = "text_analyses"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)

    # MANUAL = text introdus de student | OCR = extras din imagine
    source_type: Mapped[str] = mapped_column(String(20), nullable=False)

    # nivelul HSK calculat ca medie ponderata a tokenurilor
    overall_hsk_level: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=func.now()
    )

    # relatie one-to-many cu tokenurile extrase
    tokens: Mapped[list["AnalysisToken"]] = relationship(
        "AnalysisToken",
        back_populates="analysis",
        cascade="all, delete-orphan",
    )
from sqlalchemy import BigInteger, VARCHAR, Text, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from repository.base import Base


class AnalysisTokenEntity(Base):
    __tablename__ = "analysis_tokens"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    analysis_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("text_analyses.id", ondelete="CASCADE"), nullable=False
    )

    hanzi: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    pinyin: Mapped[str | None] = mapped_column(VARCHAR(255), nullable=True)
    translation: Mapped[str | None] = mapped_column(Text, nullable=True)
    hsk_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    position_index: Mapped[int] = mapped_column(Integer, nullable=False)

    # partea de vorbire — NOUN, VERB, ADJ, ADV, PART, PRON etc.
    # nullable pentru compatibilitate cu analizele existente in DB
    pos: Mapped[str | None] = mapped_column(VARCHAR(50), nullable=True)

    analysis: Mapped["TextAnalysisEntity"] = relationship(
        "TextAnalysisEntity",
        back_populates="tokens",
    )
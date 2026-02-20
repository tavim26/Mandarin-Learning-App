from sqlalchemy import BigInteger, String, Text, Integer, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from config.database import Base


class AnalysisToken(Base):
    __tablename__ = "analysis_tokens"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    analysis_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("text_analyses.id", ondelete="CASCADE"),
        nullable=False
    )

    hanzi: Mapped[str] = mapped_column(String(100), nullable=False)

    pinyin: Mapped[str | None] = mapped_column(String(255), nullable=True)

    translation: Mapped[str | None] = mapped_column(Text, nullable=True)

    hsk_level: Mapped[int | None] = mapped_column(Integer, nullable=True)

    position_index: Mapped[int] = mapped_column(Integer, nullable=False)

    analysis: Mapped["TextAnalysis"] = relationship(
        "TextAnalysis",
        back_populates="tokens"
    )

    __table_args__ = (
        Index("idx_analysis_id", "analysis_id"),
        Index("idx_analysis_hsk", "analysis_id", "hsk_level"),
        UniqueConstraint("analysis_id", "position_index", name="uq_analysis_position"),
    )

from sqlalchemy import BigInteger, VARCHAR, Text, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from repository.base import Base


class AnalysisTokenEntity(Base):
    __tablename__ = "analysis_tokens"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    # FK catre analiza parinte
    analysis_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("text_analyses.id", ondelete="CASCADE"), nullable=False
    )

    hanzi: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    pinyin: Mapped[str | None] = mapped_column(VARCHAR(255), nullable=True)
    translation: Mapped[str | None] = mapped_column(Text, nullable=True)

    # nivelul HSK al tokenului (1-6), None daca nu apare in listele HSK
    hsk_level: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # pozitia tokenului in textul original
    position_index: Mapped[int] = mapped_column(Integer, nullable=False)

    analysis: Mapped["TextAnalysisEntity"] = relationship(
        "TextAnalysisEntity",
        back_populates="tokens",
    )
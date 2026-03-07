from dataclasses import dataclass


@dataclass
class AnalysisToken:
    analysis_id: int
    hanzi: str
    position_index: int
    id: int = 0
    pinyin: str | None = None
    translation: str | None = None
    hsk_level: int | None = None
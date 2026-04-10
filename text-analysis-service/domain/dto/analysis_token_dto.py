from pydantic import BaseModel


class AnalysisTokenDto(BaseModel):
    id: int
    analysis_id: int
    hanzi: str
    pinyin: str | None
    translation: str | None
    hsk_level: int | None
    position_index: int
    pos: str | None

    class Config:
        from_attributes = True
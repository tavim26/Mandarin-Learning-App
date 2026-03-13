from datetime import datetime

from pydantic import BaseModel

from domain.dto.analysis_token_dto import AnalysisTokenDto


class TextAnalysisDto(BaseModel):
    id: int
    student_id: int
    raw_text: str
    source_type: str
    overall_hsk_level: int | None
    created_at: datetime
    translated_text: str | None
    # non-nullable — serviciul garanteaza intotdeauna o limba de traducere (default "en")
    translation_language: str
    tokens: list[AnalysisTokenDto]

    class Config:
        from_attributes = True
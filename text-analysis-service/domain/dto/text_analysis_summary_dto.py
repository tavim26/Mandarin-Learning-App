from datetime import datetime
from pydantic import BaseModel


# versiune fara tokeni — folosita la listare
# tokenii sunt returnati doar la GET /{analysis_id}
class TextAnalysisSummaryDto(BaseModel):
    id: int
    student_id: int
    raw_text: str
    source_type: str
    overall_hsk_level: int | None
    created_at: datetime
    translated_text: str | None
    translation_language: str

    class Config:
        from_attributes = True
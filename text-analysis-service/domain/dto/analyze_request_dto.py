from pydantic import BaseModel, Field


class AnalyzeTextRequestDto(BaseModel):
    student_id: int = Field(..., gt=0)
    raw_text: str = Field(..., min_length=1)

    # daca nu este specificata, se traduce default in engleza
    translation_language: str = Field(default="en", pattern="^(ro|en)$")
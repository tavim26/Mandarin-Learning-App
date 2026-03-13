from pydantic import BaseModel, Field


class AnalyzeTextRequestDto(BaseModel):
    raw_text: str = Field(..., min_length=1)
    # daca nu este specificata, se translateaza implicit in engleza
    translation_language: str = Field(default="en", pattern="^(ro|en)$")
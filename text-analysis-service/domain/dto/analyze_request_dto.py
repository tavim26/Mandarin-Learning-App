from pydantic import BaseModel, Field


class AnalyzeTextRequestDto(BaseModel):
    raw_text: str = Field(..., min_length=1)
    translation_language: str = Field(default="en", pattern="^(ro|en|de|es|fr)$")
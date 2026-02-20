from typing import List, Literal
from pydantic import BaseModel, Field

from domain.dto.token_dto import TokenCreateDto


class AnalysisCreateDto(BaseModel):
    student_id: int = Field(..., gt=0)
    raw_text: str = Field(..., min_length=1)
    source_type: Literal["MANUAL", "OCR"]
    tokens: List[TokenCreateDto]

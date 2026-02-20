from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from domain.dto.token_dto import TokenResponseDto


class AnalysisResponseDto(BaseModel):
    id: int
    student_id: int
    raw_text: str
    source_type: str
    overall_hsk_level: Optional[int]
    created_at: datetime
    tokens: List[TokenResponseDto]

    model_config = {
        "from_attributes": True
    }


class AnalysisSummaryDto(BaseModel):
    id: int
    overall_hsk_level: Optional[int]
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

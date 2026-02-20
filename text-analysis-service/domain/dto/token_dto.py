from typing import Optional
from pydantic import BaseModel, Field


class TokenCreateDto(BaseModel):
    hanzi: str = Field(..., min_length=1, max_length=100)
    pinyin: Optional[str] = Field(default=None, max_length=255)
    translation: Optional[str] = None
    hsk_level: Optional[int] = Field(default=None, ge=1, le=6)
    position_index: int = Field(..., ge=0)


class TokenResponseDto(BaseModel):
    id: int
    hanzi: str
    pinyin: Optional[str]
    translation: Optional[str]
    hsk_level: Optional[int]
    position_index: int

    model_config = {
        "from_attributes": True
    }

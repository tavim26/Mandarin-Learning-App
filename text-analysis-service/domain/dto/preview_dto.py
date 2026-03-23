from pydantic import BaseModel, Field


class PreviewRequestDto(BaseModel):
    text: str = Field(..., min_length=1)


class PreviewTokenDto(BaseModel):
    hanzi: str
    pinyin: str
    hsk_level: int | None
    position_index: int


class PreviewResponseDto(BaseModel):
    tokens: list[PreviewTokenDto]
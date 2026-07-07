from pydantic import BaseModel


class HskTokenDistributionDto(BaseModel):
    hsk_level: int | None
    token_count: int


class HskUniqueCharsDto(BaseModel):
    hsk_level: int
    unique_count: int
    total_in_level: int
    percentage: float


class StudentStatsDto(BaseModel):
    token_distribution: list[HskTokenDistributionDto]
    source_type_split: dict[str, int]
    unique_chars_per_hsk_level: list[HskUniqueCharsDto]
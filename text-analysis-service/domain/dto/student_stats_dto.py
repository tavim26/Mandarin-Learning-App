from pydantic import BaseModel


class HskTokenDistributionDto(BaseModel):
    hsk_level: int | None  # None = caracter necunoscut in HSK
    token_count: int


class HskUniqueCharsDto(BaseModel):
    hsk_level: int
    unique_count: int
    total_in_level: int
    percentage: float


class StudentStatsDto(BaseModel):
    # cate tokeni a intalnit studentul per nivel HSK
    token_distribution: list[HskTokenDistributionDto]
    # cate analize MANUAL vs OCR
    source_type_split: dict[str, int]
    # cate caractere unice a intalnit per nivel HSK, din totalul disponibil
    unique_chars_per_hsk_level: list[HskUniqueCharsDto]
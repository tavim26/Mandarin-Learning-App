from pydantic import BaseModel


class PageDto(BaseModel):
    items: list
    total: int
    page: int
    size: int
    total_pages: int
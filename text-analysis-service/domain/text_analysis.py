from dataclasses import dataclass, field
from datetime import datetime

from domain.analysis_token import AnalysisToken


@dataclass
class TextAnalysis:
    student_id: int
    raw_text: str
    source_type: str
    translation_language: str
    id: int = 0
    overall_hsk_level: int | None = None
    translated_text: str | None = None
    created_at: datetime = field(default_factory=datetime.now)

    # lista de tokeni asociati acestei analize
    tokens: list[AnalysisToken] = field(default_factory=list)
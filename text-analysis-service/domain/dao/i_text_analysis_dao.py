from abc import ABC, abstractmethod

from domain.text_analysis import TextAnalysis


class ITextAnalysisDao(ABC):

    @abstractmethod
    def save(self, analysis: TextAnalysis) -> TextAnalysis:
        pass

    @abstractmethod
    def find_by_id(self, analysis_id: int) -> TextAnalysis | None:
        pass

    @abstractmethod
    def find_all_by_student_id(self, student_id: int) -> list[TextAnalysis]:
        pass

    @abstractmethod
    def find_page_by_student_id(
        self,
        student_id: int,
        offset: int,
        limit: int,
        source_type: str | None,
        hsk_level: int | None,
        sort_order: str,
    ) -> tuple[list[TextAnalysis], int]:
        pass

    @abstractmethod
    def get_source_type_split(self, student_id: int) -> dict[str, int]:
        pass

    @abstractmethod
    def delete(self, analysis: TextAnalysis) -> None:
        pass
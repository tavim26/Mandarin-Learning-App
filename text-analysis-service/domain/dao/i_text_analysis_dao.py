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
    def delete(self, analysis: TextAnalysis) -> None:
        pass
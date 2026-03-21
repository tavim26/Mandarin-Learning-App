from abc import ABC, abstractmethod

from domain.analysis_token import AnalysisToken


class IAnalysisTokenDao(ABC):

    @abstractmethod
    def save_all(self, tokens: list[AnalysisToken]) -> list[AnalysisToken]:
        pass

    @abstractmethod
    def find_all_by_analysis_id(self, analysis_id: int) -> list[AnalysisToken]:
        pass

    @abstractmethod
    def get_token_hsk_distribution(self, student_id: int) -> list[tuple[int | None, int]]:
        pass

    @abstractmethod
    def get_unique_chars_per_hsk_level(self, student_id: int) -> list[tuple[int, int]]:
        pass
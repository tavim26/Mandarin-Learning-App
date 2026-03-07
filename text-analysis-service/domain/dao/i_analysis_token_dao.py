from abc import ABC, abstractmethod

from domain.analysis_token import AnalysisToken


class IAnalysisTokenDao(ABC):

    @abstractmethod
    def save_all(self, tokens: list[AnalysisToken]) -> list[AnalysisToken]:
        pass

    @abstractmethod
    def find_all_by_analysis_id(self, analysis_id: int) -> list[AnalysisToken]:
        pass
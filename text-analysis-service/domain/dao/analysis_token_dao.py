from sqlalchemy.orm import Session

from domain.analysis_token import AnalysisToken


class AnalysisTokenDao:

    def __init__(self, db: Session):
        self.db = db

    def save_all(self, tokens: list[AnalysisToken]) -> list[AnalysisToken]:
        # inserare in bulk — mai eficient decat save individual per token
        self.db.add_all(tokens)
        self.db.commit()
        return tokens

    def find_all_by_analysis_id(self, analysis_id: int) -> list[AnalysisToken]:
        return (
            self.db.query(AnalysisToken)
            .filter(AnalysisToken.analysis_id == analysis_id)
            .order_by(AnalysisToken.position_index.asc())
            .all()
        )
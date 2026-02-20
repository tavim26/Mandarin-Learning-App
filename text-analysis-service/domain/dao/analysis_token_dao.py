from typing import List

from sqlalchemy.orm import Session
from sqlalchemy import select

from domain.analysis_token import AnalysisToken


class AnalysisTokenDao:

    def save_all(
        self,
        db: Session,
        tokens: List[AnalysisToken]
    ) -> List[AnalysisToken]:
        db.add_all(tokens)
        db.flush()
        return tokens

    def find_by_analysis(
        self,
        db: Session,
        analysis_id: int
    ) -> List[AnalysisToken]:
        stmt = (
            select(AnalysisToken)
            .where(AnalysisToken.analysis_id == analysis_id)
            .order_by(AnalysisToken.position_index.asc())
        )
        result = db.execute(stmt).scalars().all()
        return result

    def delete_by_analysis(
        self,
        db: Session,
        analysis_id: int
    ) -> None:
        stmt = select(AnalysisToken).where(
            AnalysisToken.analysis_id == analysis_id
        )
        tokens = db.execute(stmt).scalars().all()
        for token in tokens:
            db.delete(token)

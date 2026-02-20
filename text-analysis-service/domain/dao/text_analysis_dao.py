from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import select

from domain.text_analysis import TextAnalysis


class TextAnalysisDao:

    def save(self, db: Session, analysis: TextAnalysis) -> TextAnalysis:
        db.add(analysis)
        db.flush()  # obține ID fără commit
        return analysis

    def find_by_id(self, db: Session, analysis_id: int) -> Optional[TextAnalysis]:
        stmt = select(TextAnalysis).where(TextAnalysis.id == analysis_id)
        result = db.execute(stmt).scalar_one_or_none()
        return result

    def find_by_student(
        self,
        db: Session,
        student_id: int
    ) -> List[TextAnalysis]:
        stmt = (
            select(TextAnalysis)
            .where(TextAnalysis.student_id == student_id)
            .order_by(TextAnalysis.created_at.desc())
        )
        result = db.execute(stmt).scalars().all()
        return result

    def delete(self, db: Session, analysis: TextAnalysis) -> None:
        db.delete(analysis)

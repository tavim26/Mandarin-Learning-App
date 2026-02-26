from sqlalchemy.orm import Session

from domain.text_analysis import TextAnalysis


class TextAnalysisDao:

    def __init__(self, db: Session):
        self.db = db

    def save(self, analysis: TextAnalysis) -> TextAnalysis:
        self.db.add(analysis)
        self.db.commit()
        self.db.refresh(analysis)
        return analysis

    def find_by_id(self, analysis_id: int) -> TextAnalysis | None:
        return self.db.query(TextAnalysis).filter(TextAnalysis.id == analysis_id).first()

    def find_all_by_student_id(self, student_id: int) -> list[TextAnalysis]:
        return (
            self.db.query(TextAnalysis)
            .filter(TextAnalysis.student_id == student_id)
            .order_by(TextAnalysis.created_at.desc())
            .all()
        )

    def delete(self, analysis: TextAnalysis) -> None:
        self.db.delete(analysis)
        self.db.commit()
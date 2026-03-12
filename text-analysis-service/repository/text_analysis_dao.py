from sqlalchemy.orm import Session

from domain.analysis_token import AnalysisToken
from domain.dao.i_text_analysis_dao import ITextAnalysisDao
from domain.text_analysis import TextAnalysis

from repository.entities.text_analysis_entity import TextAnalysisEntity


class TextAnalysisDao(ITextAnalysisDao):

    def __init__(self, db: Session):
        self.db = db

    def save(self, analysis: TextAnalysis) -> TextAnalysis:
        entity = self._to_entity(analysis)
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return self._to_domain(entity)


    def find_by_id(self, analysis_id: int) -> TextAnalysis | None:
        entity = (
            self.db.query(TextAnalysisEntity)
            .filter(TextAnalysisEntity.id == analysis_id)
            .first()
        )
        if entity is None:
            return None
        return self._to_domain(entity)


    def find_all_by_student_id(self, student_id: int) -> list[TextAnalysis]:
        entities = (
            self.db.query(TextAnalysisEntity)
            .filter(TextAnalysisEntity.student_id == student_id)
            .order_by(TextAnalysisEntity.created_at.desc())
            .all()
        )
        return [self._to_domain(e) for e in entities]


    def delete(self, analysis: TextAnalysis) -> None:
        entity = (
            self.db.query(TextAnalysisEntity)
            .filter(TextAnalysisEntity.id == analysis.id)
            .first()
        )
        if entity is not None:
            self.db.delete(entity)
            self.db.commit()





    def _to_entity(self, analysis: TextAnalysis) -> TextAnalysisEntity:
        return TextAnalysisEntity(
            id=analysis.id if analysis.id != 0 else None,
            student_id=analysis.student_id,
            raw_text=analysis.raw_text,
            source_type=analysis.source_type,
            overall_hsk_level=analysis.overall_hsk_level,
            created_at=analysis.created_at,
            translated_text=analysis.translated_text,
            translation_language=analysis.translation_language,
        )

    def _to_domain(self, entity: TextAnalysisEntity) -> TextAnalysis:
        analysis = TextAnalysis(
            id=entity.id,
            student_id=entity.student_id,
            raw_text=entity.raw_text,
            source_type=entity.source_type,
            overall_hsk_level=entity.overall_hsk_level,
            created_at=entity.created_at,
            translated_text=entity.translated_text,
            translation_language=entity.translation_language,
        )

        if entity.tokens:
            analysis.tokens = [
                AnalysisToken(
                    id=t.id,
                    analysis_id=t.analysis_id,
                    hanzi=t.hanzi,
                    pinyin=t.pinyin,
                    translation=t.translation,
                    hsk_level=t.hsk_level,
                    position_index=t.position_index,
                )
                for t in entity.tokens
            ]

        return analysis
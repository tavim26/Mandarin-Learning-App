from sqlalchemy.orm import Session, joinedload, noload

from domain.analysis_token import AnalysisToken
from domain.dao.i_text_analysis_dao import ITextAnalysisDao
from domain.text_analysis import TextAnalysis
from repository.entities.text_analysis_entity import TextAnalysisEntity


class TextAnalysisDao(ITextAnalysisDao):

    def __init__(self, db: Session):
        self.db = db

    def save(self, analysis: TextAnalysis) -> TextAnalysis:
        entity = self._to_entity(analysis)
        try:
            self.db.add(entity)
            self.db.flush()
            self.db.refresh(entity)
            return self._to_domain(entity)
        except Exception:
            self.db.rollback()
            raise

    def find_by_id(self, analysis_id: int) -> TextAnalysis | None:
        entity = (
            self.db.query(TextAnalysisEntity)
            .options(joinedload(TextAnalysisEntity.tokens))
            .filter(TextAnalysisEntity.id == analysis_id)
            .first()
        )
        if entity is None:
            return None
        return self._to_domain(entity)



    def delete(self, analysis: TextAnalysis) -> None:
        entity = (
            self.db.query(TextAnalysisEntity)
            .filter(TextAnalysisEntity.id == analysis.id)
            .first()
        )
        if entity is None:
            raise ValueError(f"Analysis with id={analysis.id} does not exist in the database")
        try:
            self.db.delete(entity)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def find_page_by_student_id(
            self,
            student_id: int,
            offset: int,
            limit: int,
            source_type: str | None,
            hsk_level: int | None,
            sort_order: str,
    ) -> tuple[list[TextAnalysis], int]:
        base_query = (
            self.db.query(TextAnalysisEntity)
            .options(noload(TextAnalysisEntity.tokens))
            .filter(TextAnalysisEntity.student_id == student_id)
        )

        if source_type is not None:
            base_query = base_query.filter(
                TextAnalysisEntity.source_type == source_type
            )

        if hsk_level is not None:
            base_query = base_query.filter(
                TextAnalysisEntity.overall_hsk_level == hsk_level
            )

        if sort_order == "oldest":
            base_query = base_query.order_by(TextAnalysisEntity.created_at.asc())
        else:
            base_query = base_query.order_by(TextAnalysisEntity.created_at.desc())

        total = base_query.count()

        entities = (
            base_query
            .offset(offset)
            .limit(limit)
            .all()
        )

        return [self._to_domain(e) for e in entities], total

    def get_source_type_split(self, student_id: int) -> dict[str, int]:
        from sqlalchemy import func

        rows = (
            self.db.query(
                TextAnalysisEntity.source_type,
                func.count(TextAnalysisEntity.id).label("count"),
            )
            .filter(TextAnalysisEntity.student_id == student_id)
            .group_by(TextAnalysisEntity.source_type)
            .all()
        )
        return {row.source_type: row.count for row in rows}



    def delete_by_id(self, analysis_id: int) -> None:
        try:
            deleted_count = (
                self.db.query(TextAnalysisEntity)
                .filter(TextAnalysisEntity.id == analysis_id)
                .delete(synchronize_session=False)
            )
            if deleted_count == 0:
                raise ValueError(f"Analysis with id={analysis_id} does not exist in the database")
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise





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
                    pos=t.pos,
                )
                for t in entity.tokens
            ]

        return analysis
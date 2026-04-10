from sqlalchemy.orm import Session

from domain.analysis_token import AnalysisToken
from domain.dao.i_analysis_token_dao import IAnalysisTokenDao
from repository.entities.analysis_token_entity import AnalysisTokenEntity


class AnalysisTokenDao(IAnalysisTokenDao):

    def __init__(self, db: Session):
        self.db = db

    def save_all(self, tokens: list[AnalysisToken]) -> list[AnalysisToken]:
        entities = [self._to_entity(t) for t in tokens]
        try:
            self.db.add_all(entities)
            # flush trimite INSERT-urile catre DB si populeaza ID-urile
            # fara sa inchida tranzactia — commit-ul este controlat de service
            self.db.flush()
            for entity in entities:
                self.db.refresh(entity)
            return [self._to_domain(e) for e in entities]
        except Exception:
            self.db.rollback()
            raise

    def find_all_by_analysis_id(self, analysis_id: int) -> list[AnalysisToken]:
        entities = (
            self.db.query(AnalysisTokenEntity)
            .filter(AnalysisTokenEntity.analysis_id == analysis_id)
            .order_by(AnalysisTokenEntity.position_index.asc())
            .all()
        )
        return [self._to_domain(e) for e in entities]


    def get_token_hsk_distribution(self, student_id: int) -> list[tuple[int | None, int]]:
        from repository.entities.text_analysis_entity import TextAnalysisEntity
        from sqlalchemy import func

        # join cu text_analyses pentru a filtra dupa student_id
        rows = (
            self.db.query(
                AnalysisTokenEntity.hsk_level,
                func.count(AnalysisTokenEntity.id).label("token_count"),
            )
            .join(
                TextAnalysisEntity,
                AnalysisTokenEntity.analysis_id == TextAnalysisEntity.id,
            )
            .filter(TextAnalysisEntity.student_id == student_id)
            .group_by(AnalysisTokenEntity.hsk_level)
            .all()
        )
        return [(row.hsk_level, row.token_count) for row in rows]


    def get_unique_chars_per_hsk_level(self, student_id: int) -> list[tuple[int, int]]:
        from repository.entities.text_analysis_entity import TextAnalysisEntity
        from sqlalchemy import func

        # numara hanzi distincte per nivel HSK — ignora tokenii fara nivel HSK
        rows = (
            self.db.query(
                AnalysisTokenEntity.hsk_level,
                func.count(AnalysisTokenEntity.hanzi.distinct()).label("unique_count"),
            )
            .join(
                TextAnalysisEntity,
                AnalysisTokenEntity.analysis_id == TextAnalysisEntity.id,
            )
            .filter(TextAnalysisEntity.student_id == student_id)
            .filter(AnalysisTokenEntity.hsk_level.isnot(None))
            .group_by(AnalysisTokenEntity.hsk_level)
            .all()
        )
        return [(row.hsk_level, row.unique_count) for row in rows]

    def _to_entity(self, token: AnalysisToken) -> AnalysisTokenEntity:
        return AnalysisTokenEntity(
            id=token.id if token.id != 0 else None,
            analysis_id=token.analysis_id,
            hanzi=token.hanzi,
            pinyin=token.pinyin,
            translation=token.translation,
            hsk_level=token.hsk_level,
            position_index=token.position_index,
            pos=token.pos,
        )

    def _to_domain(self, entity: AnalysisTokenEntity) -> AnalysisToken:
        return AnalysisToken(
            id=entity.id,
            analysis_id=entity.analysis_id,
            hanzi=entity.hanzi,
            pinyin=entity.pinyin,
            translation=entity.translation,
            hsk_level=entity.hsk_level,
            position_index=entity.position_index,
            pos=entity.pos,
        )
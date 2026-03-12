from sqlalchemy.orm import Session

from domain.analysis_token import AnalysisToken
from domain.dao.i_analysis_token_dao import IAnalysisTokenDao

from repository.entities.analysis_token_entity import AnalysisTokenEntity


class AnalysisTokenDao(IAnalysisTokenDao):

    def __init__(self, db: Session):
        self.db = db

    def save_all(self, tokens: list[AnalysisToken]) -> list[AnalysisToken]:
        entities = [self._to_entity(t) for t in tokens]

        # inserare in bulk — mai eficient decat save individual per token
        self.db.add_all(entities)
        self.db.commit()

        for entity in entities:
            self.db.refresh(entity)

        return [self._to_domain(e) for e in entities]



    def find_all_by_analysis_id(self, analysis_id: int) -> list[AnalysisToken]:
        entities = (
            self.db.query(AnalysisTokenEntity)
            .filter(AnalysisTokenEntity.analysis_id == analysis_id)
            .order_by(AnalysisTokenEntity.position_index.asc())
            .all()
        )
        return [self._to_domain(e) for e in entities]





    # --- metode private de conversie ---

    def _to_entity(self, token: AnalysisToken) -> AnalysisTokenEntity:
        return AnalysisTokenEntity(
            id=token.id if token.id != 0 else None,
            analysis_id=token.analysis_id,
            hanzi=token.hanzi,
            pinyin=token.pinyin,
            translation=token.translation,
            hsk_level=token.hsk_level,
            position_index=token.position_index,
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
        )
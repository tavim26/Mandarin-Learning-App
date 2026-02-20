from typing import List, Optional
from datetime import datetime

from sqlalchemy.orm import Session

from domain.text_analysis import TextAnalysis
from domain.analysis_token import AnalysisToken
from domain.dao.text_analysis_dao import TextAnalysisDao
from domain.dao.analysis_token_dao import AnalysisTokenDao


class AnalysisService:

    def __init__(
        self,
        text_analysis_dao: TextAnalysisDao,
        analysis_token_dao: AnalysisTokenDao
    ) -> None:
        self._text_analysis_dao = text_analysis_dao
        self._analysis_token_dao = analysis_token_dao

    def create_analysis(
        self,
        db: Session,
        student_id: int,
        raw_text: str,
        source_type: str,
        tokens_data: List[dict]
    ) -> TextAnalysis:
        """
        Creeaza o analiza noua si tokenii asociati.
        tokens_data este o lista de dict-uri cu:
        {
            "hanzi": str,
            "pinyin": str | None,
            "translation": str | None,
            "hsk_level": int | None,
            "position_index": int
        }
        """

        try:
            # Cream agregatul root
            analysis = TextAnalysis(
                student_id=student_id,
                raw_text=raw_text,
                source_type=source_type,
                overall_hsk_level=self._calculate_overall_hsk(tokens_data),
                created_at=datetime.utcnow()
            )

            # Persistam analiza pentru a obtine ID
            self._text_analysis_dao.save(db, analysis)

            # Cream entitatile copil
            tokens: List[AnalysisToken] = [
                AnalysisToken(
                    analysis_id=analysis.id,
                    hanzi=token["hanzi"],
                    pinyin=token.get("pinyin"),
                    translation=token.get("translation"),
                    hsk_level=token.get("hsk_level"),
                    position_index=token["position_index"]
                )
                for token in tokens_data
            ]

            # Persistam tokenii
            self._analysis_token_dao.save_all(db, tokens)

            # Commit tranzactie
            db.commit()

            # Refresh pentru a sincroniza obiectul cu DB
            db.refresh(analysis)

            return analysis

        except Exception:
            # In caz de eroare, anulam tranzactia
            db.rollback()
            raise

    def get_analysis_by_id(
        self,
        db: Session,
        analysis_id: int
    ) -> Optional[TextAnalysis]:
        return self._text_analysis_dao.find_by_id(db, analysis_id)

    def get_analyses_by_student(
        self,
        db: Session,
        student_id: int
    ) -> List[TextAnalysis]:
        return self._text_analysis_dao.find_by_student(db, student_id)

    def delete_analysis(
        self,
        db: Session,
        analysis_id: int
    ) -> None:
        try:
            analysis = self._text_analysis_dao.find_by_id(db, analysis_id)

            if analysis is None:
                raise ValueError("Analysis not found")

            # Delete se va propaga automat catre tokens prin cascade
            self._text_analysis_dao.delete(db, analysis)

            db.commit()

        except Exception:
            db.rollback()
            raise

    def _calculate_overall_hsk(self, tokens_data: List[dict]) -> Optional[int]:
        """
        Calculeaza nivelul global al textului.
        Strategia actuala: media nivelurilor HSK rotunjita in sus.
        """

        hsk_levels: List[int] = [
            token["hsk_level"]
            for token in tokens_data
            if token.get("hsk_level") is not None
        ]

        if not hsk_levels:
            return None

        average: float = sum(hsk_levels) / len(hsk_levels)

        # Rotunjire in sus
        overall_level: int = int(-(-average // 1))

        return overall_level

from datetime import datetime

from sqlalchemy.orm import Session

from domain.analysis_token import AnalysisToken
from domain.dao.analysis_token_dao import AnalysisTokenDao
from domain.dao.text_analysis_dao import TextAnalysisDao
from domain.dto.analyze_request_dto import AnalyzeTextRequestDto
from domain.dto.text_analysis_dto import TextAnalysisDto
from domain.text_analysis import TextAnalysis
from service.nlp_service import NlpService
from service.ocr_service import OcrService


class AnalysisService:

    def __init__(
        self,
        db: Session,
        nlp_service: NlpService,
        ocr_service: OcrService,
        text_analysis_dao: TextAnalysisDao,
        analysis_token_dao: AnalysisTokenDao,
    ):
        self._nlp = nlp_service
        self._ocr = ocr_service
        self._text_analysis_dao = text_analysis_dao
        self._analysis_token_dao = analysis_token_dao

    def analyze_text(self, request: AnalyzeTextRequestDto) -> TextAnalysisDto:
        return self._run_pipeline(
            student_id=request.student_id,
            raw_text=request.raw_text,
            source_type="MANUAL",
        )

    def analyze_image(self, student_id: int, image_bytes: bytes) -> TextAnalysisDto:
        raw_text = self._ocr.extract_text(image_bytes)
        return self._run_pipeline(
            student_id=student_id,
            raw_text=raw_text,
            source_type="OCR",
        )

    def get_analyses_by_student(self, student_id: int) -> list[TextAnalysisDto]:
        analyses = self._text_analysis_dao.find_all_by_student_id(student_id)
        return [TextAnalysisDto.model_validate(a) for a in analyses]

    def get_analysis_by_id(self, analysis_id: int) -> TextAnalysisDto | None:
        analysis = self._text_analysis_dao.find_by_id(analysis_id)
        if analysis is None:
            return None
        return TextAnalysisDto.model_validate(analysis)

    def delete_analysis(self, analysis_id: int) -> bool:
        analysis = self._text_analysis_dao.find_by_id(analysis_id)
        if analysis is None:
            return False
        self._text_analysis_dao.delete(analysis)
        return True

    # --- metode private helper ---

    def _run_pipeline(self, student_id: int, raw_text: str, source_type: str) -> TextAnalysisDto:
        # tokenizare + imbogatire lingvistica
        processed_tokens = self._nlp.process(raw_text)

        overall_hsk_level = self._calculate_overall_hsk(processed_tokens)

        analysis = TextAnalysis(
            student_id=student_id,
            raw_text=raw_text,
            source_type=source_type,
            overall_hsk_level=overall_hsk_level,
            created_at=datetime.now(),
        )
        saved_analysis = self._text_analysis_dao.save(analysis)

        tokens = [
            AnalysisToken(
                analysis_id=saved_analysis.id,
                hanzi=t["hanzi"],
                pinyin=t["pinyin"],
                translation=t["translation"],
                hsk_level=t["hsk_level"],
                position_index=t["position_index"],
            )
            for t in processed_tokens
        ]
        self._analysis_token_dao.save_all(tokens)

        # reload pentru a include tokenurile in raspuns
        saved_analysis = self._text_analysis_dao.find_by_id(saved_analysis.id)
        return TextAnalysisDto.model_validate(saved_analysis)

    def _calculate_overall_hsk(self, tokens: list[dict]) -> int | None:
        # media ponderata: fiecare token cu nivel HSK cunoscut contribuie egal
        levels = [t["hsk_level"] for t in tokens if t["hsk_level"] is not None]

        if not levels:
            return None

        return round(sum(levels) / len(levels))
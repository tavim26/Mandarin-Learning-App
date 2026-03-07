from datetime import datetime

from domain.analysis_token import AnalysisToken
from domain.text_analysis import TextAnalysis

from domain.dao.i_analysis_token_dao import IAnalysisTokenDao
from domain.dao.i_text_analysis_dao import ITextAnalysisDao

from domain.dto.analysis_token_dto import AnalysisTokenDto
from domain.dto.analyze_request_dto import AnalyzeTextRequestDto
from domain.dto.text_analysis_dto import TextAnalysisDto

from service.nlp_service import NlpService
from service.ocr_service import OcrService
from service.translation_service import TranslationService


class AnalysisService:

    def __init__(
        self,
        nlp_service: NlpService,
        ocr_service: OcrService,
        text_analysis_dao: ITextAnalysisDao,
        analysis_token_dao: IAnalysisTokenDao,
        translation_service: TranslationService,
    ):
        self._nlp = nlp_service
        self._ocr = ocr_service
        self._text_analysis_dao = text_analysis_dao
        self._analysis_token_dao = analysis_token_dao
        self._translation = translation_service

    def analyze_text(self, request: AnalyzeTextRequestDto) -> TextAnalysisDto:
        return self._run_pipeline(
            student_id=request.student_id,
            raw_text=request.raw_text,
            source_type="MANUAL",
            translation_language=request.translation_language,
        )

    def analyze_image(
        self,
        student_id: int,
        image_bytes: bytes,
        translation_language: str,
    ) -> TextAnalysisDto:
        raw_text = self._ocr.extract_text(image_bytes)
        return self._run_pipeline(
            student_id=student_id,
            raw_text=raw_text,
            source_type="OCR",
            translation_language=translation_language,
        )

    def get_analyses_by_student(self, student_id: int) -> list[TextAnalysisDto]:
        analyses = self._text_analysis_dao.find_all_by_student_id(student_id)
        return [self._to_dto(a) for a in analyses]

    def get_analysis_by_id(self, analysis_id: int) -> TextAnalysisDto | None:
        analysis = self._text_analysis_dao.find_by_id(analysis_id)
        if analysis is None:
            return None
        return self._to_dto(analysis)

    def delete_analysis(self, analysis_id: int) -> bool:
        analysis = self._text_analysis_dao.find_by_id(analysis_id)
        if analysis is None:
            return False
        self._text_analysis_dao.delete(analysis)
        return True

    # --- metode private helper ---

    def _run_pipeline(
        self,
        student_id: int,
        raw_text: str,
        source_type: str,
        translation_language: str,
    ) -> TextAnalysisDto:
        processed_tokens = self._nlp.process(raw_text)
        overall_hsk_level = self._calculate_overall_hsk(processed_tokens)

        # traducere text integral
        translated_text = self._translation.translate(raw_text, translation_language)

        # traducere toti tokenii intr-un singur apel API
        hanzi_list = [t["hanzi"] for t in processed_tokens]
        token_translations = self._translation.translate_bulk(hanzi_list, translation_language)

        analysis = TextAnalysis(
            student_id=student_id,
            raw_text=raw_text,
            source_type=source_type,
            overall_hsk_level=overall_hsk_level,
            created_at=datetime.now(),
            translated_text=translated_text,
            translation_language=translation_language,
        )
        saved_analysis = self._text_analysis_dao.save(analysis)

        tokens = [
            AnalysisToken(
                analysis_id=saved_analysis.id,
                hanzi=t["hanzi"],
                pinyin=t["pinyin"],
                translation=token_translations[i],
                hsk_level=t["hsk_level"],
                position_index=t["position_index"],
            )
            for i, t in enumerate(processed_tokens)
        ]
        self._analysis_token_dao.save_all(tokens)

        # reload pentru a include tokenii in raspuns
        saved_analysis = self._text_analysis_dao.find_by_id(saved_analysis.id)
        return self._to_dto(saved_analysis)

    def _calculate_overall_hsk(self, tokens: list[dict]) -> int | None:
        # media ponderata: fiecare token cu nivel HSK cunoscut contribuie egal
        levels = [t["hsk_level"] for t in tokens if t["hsk_level"] is not None]
        if not levels:
            return None
        return round(sum(levels) / len(levels))

    def _to_dto(self, analysis: TextAnalysis) -> TextAnalysisDto:
        return TextAnalysisDto(
            id=analysis.id,
            student_id=analysis.student_id,
            raw_text=analysis.raw_text,
            source_type=analysis.source_type,
            overall_hsk_level=analysis.overall_hsk_level,
            created_at=analysis.created_at,
            translated_text=analysis.translated_text,
            translation_language=analysis.translation_language,
            tokens=[
                AnalysisTokenDto(
                    id=t.id,
                    analysis_id=t.analysis_id,
                    hanzi=t.hanzi,
                    pinyin=t.pinyin,
                    translation=t.translation,
                    hsk_level=t.hsk_level,
                    position_index=t.position_index,
                )
                for t in analysis.tokens
            ]
        )
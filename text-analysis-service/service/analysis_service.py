from datetime import datetime

from sqlalchemy.orm import Session

from domain.analysis_token import AnalysisToken
from domain.dao.i_analysis_token_dao import IAnalysisTokenDao
from domain.dao.i_text_analysis_dao import ITextAnalysisDao
from domain.dto.analysis_token_dto import AnalysisTokenDto
from domain.dto.analyze_request_dto import AnalyzeTextRequestDto
from domain.dto.preview_dto import PreviewResponseDto
from domain.dto.student_stats_dto import HskTokenDistributionDto
from domain.dto.student_stats_dto import HskUniqueCharsDto
from domain.dto.student_stats_dto import StudentStatsDto
from domain.dto.text_analysis_dto import TextAnalysisDto
from domain.dto.text_analysis_summary_dto import TextAnalysisSummaryDto
from domain.text_analysis import TextAnalysis
from service.hsk_service import HskService
from service.nlp_service import NlpService
from service.ocr_service import OcrService
from service.translation_service import TranslationService


class AnalysisService:

    def __init__(
            self,
            db: Session,
            nlp_service: NlpService,
            ocr_service: OcrService,
            text_analysis_dao: ITextAnalysisDao,
            analysis_token_dao: IAnalysisTokenDao,
            translation_service: TranslationService,
            hsk_service: HskService,
    ):
        self._db = db
        self._nlp = nlp_service
        self._ocr = ocr_service
        self._text_analysis_dao = text_analysis_dao
        self._analysis_token_dao = analysis_token_dao
        self._translation = translation_service
        self._hsk = hsk_service


    def analyze_text(self, request: AnalyzeTextRequestDto, student_id: int) -> TextAnalysisDto:
        return self._run_pipeline(
            student_id=student_id,
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

        # text gol inseamna ca imaginea nu contine text chinezesc recognoscibil
        if not raw_text.strip():
            raise ValueError("Nu s-a putut extrage text din imaginea furnizata.")

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

    def get_analyses_by_student_paginated(
            self,
            student_id: int,
            page: int,
            size: int,
            source_type: str | None,
            hsk_level: int | None,
            sort_order: str,
    ) -> dict:
        offset = (page - 1) * size
        analyses, total = self._text_analysis_dao.find_page_by_student_id(
            student_id=student_id,
            offset=offset,
            limit=size,
            source_type=source_type,
            hsk_level=hsk_level,
            sort_order=sort_order,
        )
        total_pages = (total + size - 1) // size

        return {
            "items": [self._to_summary_dto(a) for a in analyses],
            "total": total,
            "page": page,
            "size": size,
            "total_pages": total_pages,
        }

    def get_student_stats(self, student_id: int) -> StudentStatsDto:

        # statistica 1 — distributie tokeni pe nivel HSK
        raw_distribution = self._analysis_token_dao.get_token_hsk_distribution(student_id)
        token_distribution = [
            HskTokenDistributionDto(hsk_level=level, token_count=count)
            for level, count in sorted(
                raw_distribution,
                key=lambda x: (x[0] is None, x[0])  # None merge la final
            )
        ]

        # statistica 2 — split MANUAL vs OCR
        source_type_split = self._text_analysis_dao.get_source_type_split(student_id)

        # statistica 3 — caractere unice per nivel HSK
        totals_per_level = self._hsk.get_total_per_level()
        raw_unique = self._analysis_token_dao.get_unique_chars_per_hsk_level(student_id)
        unique_chars_per_hsk_level = [
            HskUniqueCharsDto(
                hsk_level=level,
                unique_count=unique_count,
                total_in_level=totals_per_level.get(level, 0),
                percentage=round(
                    (unique_count / totals_per_level[level]) * 100, 2
                ) if totals_per_level.get(level) else 0.0,
            )
            for level, unique_count in sorted(raw_unique, key=lambda x: x[0])
        ]

        return StudentStatsDto(
            token_distribution=token_distribution,
            source_type_split=source_type_split,
            unique_chars_per_hsk_level=unique_chars_per_hsk_level,
        )

    def preview_text(self, text: str) -> PreviewResponseDto:
        from domain.dto.preview_dto import PreviewResponseDto, PreviewTokenDto

        processed_tokens = self._nlp.process(text)

        return PreviewResponseDto(
            tokens=[
                PreviewTokenDto(
                    hanzi=t["hanzi"],
                    pinyin=t["pinyin"],
                    hsk_level=t["hsk_level"],
                    position_index=t["position_index"],
                    pos=t["pos"],
                )
                for t in processed_tokens
            ]
        )



    # --- metode helper ---

    def _run_pipeline(
            self,
            student_id: int,
            raw_text: str,
            source_type: str,
            translation_language: str,
    ) -> TextAnalysisDto:
        processed_tokens = self._nlp.process(raw_text)
        overall_hsk_level = self._calculate_overall_hsk(processed_tokens)

        translated_text = self._translation.translate(raw_text, translation_language)

        hanzi_list = [t["hanzi"] for t in processed_tokens]

        # translate_bulk cu lista goala returneaza [] fara apel API
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

        try:
            saved_analysis = self._text_analysis_dao.save(analysis)

            tokens = [
                AnalysisToken(
                    analysis_id=saved_analysis.id,
                    hanzi=t["hanzi"],
                    pinyin=t["pinyin"],
                    translation=token_translations[i],
                    hsk_level=t["hsk_level"],
                    position_index=t["position_index"],
                    pos=t["pos"],
                )
                for i, t in enumerate(processed_tokens)
            ]
            self._analysis_token_dao.save_all(tokens)
            self._db.commit()

        except Exception:
            self._db.rollback()
            raise

        saved_analysis = self._text_analysis_dao.find_by_id(saved_analysis.id)
        return self._to_dto(saved_analysis)




    def _calculate_overall_hsk(self, tokens: list[dict]) -> int | None:
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
                    pos=t.pos,
                )
                for t in analysis.tokens
            ]
        )

    def _to_summary_dto(self, analysis: TextAnalysis) -> TextAnalysisSummaryDto:
        from domain.dto.text_analysis_summary_dto import TextAnalysisSummaryDto
        return TextAnalysisSummaryDto(
            id=analysis.id,
            student_id=analysis.student_id,
            raw_text=analysis.raw_text,
            source_type=analysis.source_type,
            overall_hsk_level=analysis.overall_hsk_level,
            created_at=analysis.created_at,
            translated_text=analysis.translated_text,
            translation_language=analysis.translation_language,
        )
import os

from dotenv import load_dotenv
load_dotenv()


from fastapi import Depends
from sqlalchemy.orm import Session

from config.database import get_db
from domain.dao.i_analysis_token_dao import AnalysisTokenDao
from domain.dao.i_text_analysis_dao import TextAnalysisDao
from service.analysis_service import AnalysisService
from service.hsk_service import HskService
from service.nlp_service import NlpService
from service.ocr_service import OcrService
from service.translation_service import TranslationService

# --- singletons pentru serviciile stateless (incarcate o singura data) ---

# CedictService si HskService incarca fisiere mari in memorie la instantiere
_hsk_service = HskService()
_nlp_service = NlpService(_hsk_service)

# OcrService incarca modelul EasyOCR la instantiere
_ocr_service = OcrService()

# cheia API este citita din variabila de mediu
_google_api_key = os.getenv("GOOGLE_TRANSLATE_API_KEY", "")
_translation_service = TranslationService(api_key=_google_api_key)


def get_analysis_service(db: Session = Depends(get_db)) -> AnalysisService:
    # DAO-urile primesc sesiunea db per request
    text_analysis_dao = TextAnalysisDao(db)
    analysis_token_dao = AnalysisTokenDao(db)

    return AnalysisService(
        db=db,
        nlp_service=_nlp_service,
        ocr_service=_ocr_service,
        text_analysis_dao=text_analysis_dao,
        analysis_token_dao=analysis_token_dao,
        translation_service=_translation_service,
    )
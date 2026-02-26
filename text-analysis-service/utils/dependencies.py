from fastapi import Depends
from sqlalchemy.orm import Session

from config.database import get_db
from domain.dao.analysis_token_dao import AnalysisTokenDao
from domain.dao.text_analysis_dao import TextAnalysisDao
from service.analysis_service import AnalysisService
from service.cedict_service import CedictService
from service.hsk_service import HskService
from service.nlp_service import NlpService
from service.ocr_service import OcrService

# --- singletons pentru serviciile stateless (incarcate o singura data) ---

# CedictService si HskService incarca fisiere mari in memorie la instantiere
# nu are sens sa le recream la fiecare request
_cedict_service = CedictService()
_hsk_service = HskService()
_nlp_service = NlpService(_cedict_service, _hsk_service)

# OcrService incarca modelul EasyOCR la instantiere (~300MB)
# trebuie sa fie singleton obligatoriu
_ocr_service = OcrService()


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
    )
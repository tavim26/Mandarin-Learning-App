from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header, Query

from domain.dto.analyze_request_dto import AnalyzeTextRequestDto
from domain.dto.text_analysis_dto import TextAnalysisDto
from domain.dto.page_dto import PageDto
from domain.dto.student_stats_dto import StudentStatsDto as StudentStatsDtoResponse
from domain.dto.preview_dto import PreviewRequestDto, PreviewResponseDto

from service.analysis_service import AnalysisService
from service.ocr_service import OcrException
from service.translation_service import TranslationException

from utils.dependencies import get_analysis_service

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


def _verify_student_access(x_user_id: int, x_user_role: str, target_student_id: int) -> None:
    if x_user_role == "TEACHER":
        raise HTTPException(
            status_code=403,
            detail="Acces interzis: profesorii nu pot accesa modulul de analiza text"
        )
    if x_user_role == "STUDENT" and x_user_id != target_student_id:
        raise HTTPException(
            status_code=403,
            detail="Acces interzis: nu poti accesa resursele altui student"
        )


# --- endpoints POST ---

@router.post("/text", response_model=TextAnalysisDto, status_code=201)
def analyze_text(
    request: AnalyzeTextRequestDto,
    x_user_id: int = Header(..., alias="X-User-Id"),
    x_user_role: str = Header(..., alias="X-User-Role"),
    service: AnalysisService = Depends(get_analysis_service),
):
    # student_id este preluat exclusiv din headerul injectat de API Gateway
    _verify_student_access(x_user_id, x_user_role, x_user_id)
    try:
        return service.analyze_text(request, student_id=x_user_id)
    except TranslationException as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/ocr", response_model=TextAnalysisDto, status_code=201)
async def analyze_image(
    image: UploadFile = File(...),
    translation_language: str = Form(default="en", pattern="^(ro|en)$"),
    x_user_id: int = Header(..., alias="X-User-Id"),
    x_user_role: str = Header(..., alias="X-User-Role"),
    service: AnalysisService = Depends(get_analysis_service),
):
    _verify_student_access(x_user_id, x_user_role, x_user_id)
    image_bytes = await image.read()
    try:
        return service.analyze_image(x_user_id, image_bytes, translation_language)
    except OcrException as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except TranslationException as e:
        raise HTTPException(status_code=503, detail=str(e))


# --- endpoints GET cu path /student/... ---
# IMPORTANT: toate rutele /student/... trebuie declarate INAINTEA rutei /{analysis_id}
# altfel FastAPI ar putea interpreta "student" ca valoare pentru analysis_id

@router.get("/student/{student_id}/stats", response_model=StudentStatsDtoResponse)
def get_student_stats(
    student_id: int,
    x_user_id: int = Header(..., alias="X-User-Id"),
    x_user_role: str = Header(..., alias="X-User-Role"),
    service: AnalysisService = Depends(get_analysis_service),
):
    _verify_student_access(x_user_id, x_user_role, student_id)
    return service.get_student_stats(student_id)


@router.get("/student/{student_id}", response_model=PageDto)
def get_analyses_by_student(
    student_id: int,
    x_user_id: int = Header(..., alias="X-User-Id"),
    x_user_role: str = Header(..., alias="X-User-Role"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    source_type: str | None = Query(default=None, pattern="^(MANUAL|OCR)$"),
    hsk_level: int | None = Query(default=None, ge=1, le=6),
    sort_order: str = Query(default="newest", pattern="^(newest|oldest)$"),
    service: AnalysisService = Depends(get_analysis_service),
):
    _verify_student_access(x_user_id, x_user_role, student_id)
    return service.get_analyses_by_student_paginated(
        student_id=student_id,
        page=page,
        size=size,
        source_type=source_type,
        hsk_level=hsk_level,
        sort_order=sort_order,
    )


# --- endpoints GET/DELETE cu path /{analysis_id} ---

@router.get("/{analysis_id}", response_model=TextAnalysisDto)
def get_analysis_by_id(
    analysis_id: int,
    x_user_id: int = Header(..., alias="X-User-Id"),
    x_user_role: str = Header(..., alias="X-User-Role"),
    service: AnalysisService = Depends(get_analysis_service),
):
    result = service.get_analysis_by_id(analysis_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Analiza nu a fost gasita")
    # ownership-ul se verifica dupa ce obtinem analiza si cunoastem student_id-ul real
    _verify_student_access(x_user_id, x_user_role, result.student_id)
    return result


@router.delete("/{analysis_id}", status_code=204)
def delete_analysis(
    analysis_id: int,
    x_user_id: int = Header(..., alias="X-User-Id"),
    x_user_role: str = Header(..., alias="X-User-Role"),
    service: AnalysisService = Depends(get_analysis_service),
):
    analysis = service.get_analysis_by_id(analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analiza nu a fost gasita")
    # ownership-ul se verifica inainte de stergere
    _verify_student_access(x_user_id, x_user_role, analysis.student_id)
    service.delete_analysis(analysis_id)




@router.post("/preview", response_model=PreviewResponseDto)
def preview_text(
    request: PreviewRequestDto,
    x_user_id: int = Header(..., alias="X-User-Id"),
    x_user_role: str = Header(..., alias="X-User-Role"),
    service: AnalysisService = Depends(get_analysis_service),
):

    return service.preview_text(request.text)
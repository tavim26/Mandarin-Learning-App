from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from config.database import get_db
from domain.dto.analyze_request_dto import AnalyzeTextRequestDto
from domain.dto.text_analysis_dto import TextAnalysisDto
from service.analysis_service import AnalysisService
from utils.dependencies import get_analysis_service

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


# http://localhost:8085/docs

@router.post("/text", response_model=TextAnalysisDto, status_code=201)
def analyze_text(
    request: AnalyzeTextRequestDto,
    service: AnalysisService = Depends(get_analysis_service),
):
    return service.analyze_text(request)


@router.post("/ocr", response_model=TextAnalysisDto, status_code=201)
async def analyze_image(
    student_id: int = Form(..., gt=0),
    image: UploadFile = File(...),
    service: AnalysisService = Depends(get_analysis_service),
):
    image_bytes = await image.read()
    return service.analyze_image(student_id, image_bytes)


@router.get("/student/{student_id}", response_model=list[TextAnalysisDto])
def get_analyses_by_student(
    student_id: int,
    service: AnalysisService = Depends(get_analysis_service),
):
    return service.get_analyses_by_student(student_id)


@router.get("/{analysis_id}", response_model=TextAnalysisDto)
def get_analysis_by_id(
    analysis_id: int,
    service: AnalysisService = Depends(get_analysis_service),
):
    result = service.get_analysis_by_id(analysis_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Analiza nu a fost gasita")
    return result


@router.delete("/{analysis_id}", status_code=204)
def delete_analysis(
    analysis_id: int,
    service: AnalysisService = Depends(get_analysis_service),
):
    deleted = service.delete_analysis(analysis_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Analiza nu a fost gasita")
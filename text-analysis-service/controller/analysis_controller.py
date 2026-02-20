from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from service.analysis_service import AnalysisService
from domain.dao.text_analysis_dao import TextAnalysisDao
from domain.dao.analysis_token_dao import AnalysisTokenDao

from domain.dto.analysis_request_dto import AnalysisCreateDto
from domain.dto.analysis_response_dto import (
    AnalysisResponseDto,
    AnalysisSummaryDto
)
from domain.dto.token_dto import TokenResponseDto


router = APIRouter(prefix="/analyses", tags=["Text Analyses"])


# Instantiere dependinte
text_analysis_dao = TextAnalysisDao()
analysis_token_dao = AnalysisTokenDao()
analysis_service = AnalysisService(text_analysis_dao, analysis_token_dao)


@router.post("/", response_model=AnalysisResponseDto)
def create_analysis(
    payload: AnalysisCreateDto,
    db: Session = Depends(get_db)
) -> AnalysisResponseDto:
    """
    Creeaza o analiza noua folosind DTO tipat.
    """

    try:
        analysis = analysis_service.create_analysis(
            db=db,
            student_id=payload.student_id,
            raw_text=payload.raw_text,
            source_type=payload.source_type,
            tokens_data=[token.model_dump() for token in payload.tokens]
        )

        # incarcam tokenii pentru raspuns
        tokens = analysis.tokens

        return AnalysisResponseDto(
            id=analysis.id,
            student_id=analysis.student_id,
            raw_text=analysis.raw_text,
            source_type=analysis.source_type,
            overall_hsk_level=analysis.overall_hsk_level,
            created_at=analysis.created_at,
            tokens=[
                TokenResponseDto.model_validate(token)
                for token in tokens
            ]
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{analysis_id}", response_model=AnalysisResponseDto)
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
) -> AnalysisResponseDto:

    analysis = analysis_service.get_analysis_by_id(db, analysis_id)

    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found")

    tokens = analysis.tokens

    return AnalysisResponseDto(
        id=analysis.id,
        student_id=analysis.student_id,
        raw_text=analysis.raw_text,
        source_type=analysis.source_type,
        overall_hsk_level=analysis.overall_hsk_level,
        created_at=analysis.created_at,
        tokens=[
            TokenResponseDto.model_validate(token)
            for token in tokens
        ]
    )


@router.get("/student/{student_id}", response_model=List[AnalysisSummaryDto])
def get_analyses_by_student(
    student_id: int,
    db: Session = Depends(get_db)
) -> List[AnalysisSummaryDto]:

    analyses = analysis_service.get_analyses_by_student(db, student_id)

    return [
        AnalysisSummaryDto.model_validate(a)
        for a in analyses
    ]


@router.delete("/{analysis_id}")
def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
) -> dict:

    try:
        analysis_service.delete_analysis(db, analysis_id)
        return {"message": "Deleted successfully"}

    except ValueError:
        raise HTTPException(status_code=404, detail="Analysis not found")

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

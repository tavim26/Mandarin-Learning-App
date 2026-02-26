from pydantic import BaseModel, Field


class AnalyzeTextRequestDto(BaseModel):
    student_id: int = Field(..., gt=0)
    raw_text: str = Field(..., min_length=1)


# pentru OCR, request-ul nu este un JSON body, ci multipart/form-data
# FastAPI primeste student_id ca Form field si imaginea ca UploadFile
# prin urmare nu definim un Pydantic model pentru OCR request
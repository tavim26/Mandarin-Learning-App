import io

import easyocr
import numpy as np
from PIL import Image, UnidentifiedImageError


class OcrException(Exception):
    """Exceptie ridicata cand extragerea textului din imagine esueaza."""
    pass


class OcrService:

    def __init__(self):
        self._reader: easyocr.Reader | None = None


    def _get_reader(self) -> easyocr.Reader:
        if self._reader is None:
            self._reader = easyocr.Reader(["ch_sim"], gpu=False)
        return self._reader



    def extract_text(self, image_bytes: bytes) -> str:
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except UnidentifiedImageError:
            raise OcrException("Fisierul furnizat nu este o imagine valida sau formatul nu este suportat.")
        except Exception as e:
            raise OcrException(f"Eroare la procesarea imaginii: {e}")

        try:
            image_array = np.array(image)
            results = self._get_reader().readtext(image_array, detail=1)
        except Exception as e:
            raise OcrException(f"Eroare la extragerea textului din imagine: {e}")

        # sortare dupa coordonata Y a coltului stanga-sus — reconstituie ordinea de citire
        results.sort(key=lambda r: r[0][0][1])
        extracted_texts = [text for (_, text, _) in results]

        return "".join(extracted_texts)
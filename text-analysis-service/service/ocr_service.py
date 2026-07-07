import io
import threading

import easyocr
import numpy as np
from PIL import Image, UnidentifiedImageError


class OcrException(Exception):
    """Exception when text extraction fails."""
    pass


class OcrService:

    def __init__(self):
        self._reader: easyocr.Reader | None = None
        self._lock = threading.Lock()


    def _get_reader(self) -> easyocr.Reader:
        if self._reader is None:
            with self._lock:
                if self._reader is None:
                    self._reader = easyocr.Reader(["ch_sim"], gpu=False)
        return self._reader



    def extract_text(self, image_bytes: bytes) -> str:
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except UnidentifiedImageError:
            raise OcrException("The provided file is not a valid image or the format is not supported.")
        except Exception as e:
            raise OcrException(f"Error processing image: {e}")

        try:
            image_array = np.array(image)
            results = self._get_reader().readtext(image_array, detail=1)
        except Exception as e:
            raise OcrException(f"Error extracting text from image: {e}")

        results.sort(key=lambda r: r[0][0][1])
        extracted_texts = [text for (_, text, _) in results]

        return "".join(extracted_texts)
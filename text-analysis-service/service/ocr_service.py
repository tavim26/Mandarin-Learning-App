import easyocr
import numpy as np
from PIL import Image
import io


class OcrService:

    def __init__(self):
        # ch_sim = chineza simplificata, gpu=False pentru compatibilitate maxima
        self._reader = easyocr.Reader(["ch_sim"], gpu=False)

    def extract_text(self, image_bytes: bytes) -> str:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_array = np.array(image)

        # rezultatul este o lista de tuple: (bbox, text, confidence)
        results = self._reader.readtext(image_array, detail=1)

        # extragem doar textul, ordonat de sus in jos dupa coordonata Y
        results.sort(key=lambda r: r[0][0][1])
        extracted_texts = [text for (_, text, _) in results]

        return "".join(extracted_texts)
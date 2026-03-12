import easyocr
import numpy as np
from PIL import Image
import io


class OcrService:

    def __init__(self):
        # ch_sim = chineza simplificata,
        # initializarea reader-ului
        self._reader = easyocr.Reader(["ch_sim"], gpu=False)

    def extract_text(self, image_bytes: bytes) -> str:
        # convertire la RGB pentru a elimina canalul alpha (PNG) sau alte formate incompatibile
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # easyocr necesita numpy array, nu obiect PIL
        image_array = np.array(image)

        # detail=1 returneaza bounding box + text + scor de incredere pentru fiecare regiune detectata
        results = self._reader.readtext(image_array, detail=1)

        # bbox are structura: [[x1,y1], [x2,y1], [x2,y2], [x1,y2]] — primul punct este coltul stanga-sus
        # sortarea dupa r[0][0][1] = coordonata Y a coltului stanga-sus reconstituie ordinea de citire
        results.sort(key=lambda r: r[0][0][1])
        extracted_texts = [text for (_, text, _) in results]

        # concatenare fara separator
        return "".join(extracted_texts)
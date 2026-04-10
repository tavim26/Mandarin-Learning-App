import spacy
from pypinyin import pinyin, Style

from service.hsk_service import HskService

# mapare tag-uri spaCy universale catre etichete lizibile
# https://universaldependencies.org/u/pos/
_POS_LABELS: dict[str, str] = {
    "NOUN":  "substantiv",
    "VERB":  "verb",
    "ADJ":   "adjectiv",
    "ADV":   "adverb",
    "PRON":  "pronume",
    "PROPN": "nume propriu",
    "NUM":   "numar",
    "PART":  "particula",
    "ADP":   "prepozitie",
    "CONJ":  "conjunctie",
    "CCONJ": "conjunctie",
    "SCONJ": "conjunctie",
    "DET":   "determinant",
    "AUX":   "auxiliar",
    "INTJ":  "interjectie",
    "PUNCT": "punctuatie",
    "SYM":   "simbol",
    "X":     "necunoscut",
}


class NlpService:

    def __init__(self, hsk_service: HskService):
        self._hsk = hsk_service
        # modelul spaCy este incarcat o singura data la instantiere
        self._nlp = spacy.load("zh_core_web_md")

    def process(self, text: str) -> list[dict]:
        doc = self._nlp(text)
        result = []
        valid_index = 0

        for token in doc:
            hanzi = token.text.strip()

            # ignora tokenii goi, spatiile si punctuatia pura
            if not hanzi:
                continue

            pinyin_result = pinyin(hanzi, style=Style.TONE)
            pinyin_str = " ".join([p[0] for p in pinyin_result])

            result.append({
                "hanzi": hanzi,
                "pinyin": pinyin_str,
                "hsk_level": self._hsk.get_level(hanzi),
                "position_index": valid_index,
                "pos": _POS_LABELS.get(token.pos_, token.pos_),
            })

            valid_index += 1

        return result
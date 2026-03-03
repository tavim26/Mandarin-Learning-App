import json
from pathlib import Path


# fisier JSON cu structura: { "hanzi": nivel_hsk }

HSK_PATH = Path(__file__).parent.parent / "resources" / "hsk_words.json"


class HskService:

    def __init__(self):
        # dictionarul principal: hanzi -> nivel HSK (1-6)
        self._hsk_map: dict[str, int] = {}
        self._load()

    def _load(self) -> None:
        with open(HSK_PATH, encoding="utf-8") as f:
            self._hsk_map = json.load(f)

    def get_level(self, hanzi: str) -> int | None:
        # returneaza None daca termenul nu apare in listele HSK 1-6
        return self._hsk_map.get(hanzi)
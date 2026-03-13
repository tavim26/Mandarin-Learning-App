import json
from pathlib import Path

HSK_PATH = Path(__file__).parent.parent / "resources" / "hsk_words.json"


class HskService:

    def __init__(self):
        self._hsk_map: dict[str, int] = {}
        self._load()

    def _load(self) -> None:
        if not HSK_PATH.exists():
            raise RuntimeError(
                f"Fisierul HSK nu a fost gasit la calea: {HSK_PATH}. "
                f"Verifica ca directorul 'resources' exista si contine 'hsk_words.json'."
            )
        try:
            with open(HSK_PATH, encoding="utf-8") as f:
                self._hsk_map = json.load(f)
        except json.JSONDecodeError as e:
            raise RuntimeError(
                f"Fisierul HSK nu este un JSON valid: {e}"
            )

    def get_level(self, hanzi: str) -> int | None:
        return self._hsk_map.get(hanzi)
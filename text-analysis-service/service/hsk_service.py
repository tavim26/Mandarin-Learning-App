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
                f"HSK file not found at path: {HSK_PATH}. "
                f"Make sure the 'resources' directory exists and contains 'hsk_words.json'."
            )
        try:
            with open(HSK_PATH, encoding="utf-8") as f:
                self._hsk_map = json.load(f)
        except json.JSONDecodeError as e:
            raise RuntimeError(
                f"HSK file is not valid JSON: {e}"
            )


    def get_level(self, hanzi: str) -> int | None:
        return self._hsk_map.get(hanzi)


    def get_total_per_level(self) -> dict[int, int]:
        totals: dict[int, int] = {}
        for level in self._hsk_map.values():
            totals[level] = totals.get(level, 0) + 1
        return totals
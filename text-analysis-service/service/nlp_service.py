import jieba
from pypinyin import pinyin, Style

from service.hsk_service import HskService


class NlpService:


    def __init__(self, hsk_service: HskService):
        self._hsk = hsk_service


    def process(self, text: str) -> list[dict]:
        # cut_all=False = modul precis
        tokens = list(jieba.cut(text, cut_all=False))
        result = []

        # contor separat — reflecta pozitia in lista de tokeni valizi, nu in lista jieba
        valid_index = 0

        for token in tokens:
            token = token.strip()

            # jieba poate produce tokeni goi sau spatii — acestia sunt ignorati
            if not token:
                continue

            # Style.TONE = pinyin cu diacritice tonale
            pinyin_result = pinyin(token, style=Style.TONE)
            pinyin_str = " ".join([p[0] for p in pinyin_result])

            result.append({
                "hanzi": token,
                "pinyin": pinyin_str,
                "hsk_level": self._hsk.get_level(token),
                "position_index": valid_index,
            })

            valid_index += 1

        return result
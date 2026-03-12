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

        for index, token in enumerate(tokens):
            token = token.strip()

            # jieba poate produce tokeni goi sau spatii; astia sunt ignorati
            if not token:
                continue

            # Style.TONE = pinyin cu diacritice tonale
            pinyin_result = pinyin(token, style=Style.TONE)

            # fiecare silaba este o lista cu un singur element
            pinyin_str = " ".join([p[0] for p in pinyin_result])

            # position_index reflecta pozitia din lista jieba
            result.append({
                "hanzi": token,
                "pinyin": pinyin_str,
                "hsk_level": self._hsk.get_level(token),
                "position_index": index,
            })

        return result
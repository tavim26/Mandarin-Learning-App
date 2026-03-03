import jieba
from pypinyin import pinyin, Style

from service.hsk_service import HskService


class NlpService:

    def __init__(self, hsk_service: HskService):
        self._hsk = hsk_service

    def process(self, text: str) -> list[dict]:
        tokens = list(jieba.cut(text, cut_all=False))
        result = []

        for index, token in enumerate(tokens):
            token = token.strip()

            # sarim spatiile si caracterele goale produse de jieba
            if not token:
                continue

            pinyin_result = pinyin(token, style=Style.TONE)
            pinyin_str = " ".join([p[0] for p in pinyin_result])

            result.append({
                "hanzi": token,
                "pinyin": pinyin_str,
                "hsk_level": self._hsk.get_level(token),
                "position_index": index,
            })

        return result
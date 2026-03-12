import requests

GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2"


class TranslationService:

    def __init__(self, api_key: str):
        self._api_key = api_key

    def translate(self, text: str, target_language: str) -> str:
        # traducere text integral
        params = {
            "key": self._api_key,
            "q": text,
            "source": "zh-CN",
            "target": target_language,
            "format": "text",
        }
        response = requests.post(GOOGLE_TRANSLATE_URL, params=params)

        if response.status_code != 200:
            raise RuntimeError(f"Google Translate API error: {response.text}")

        return response.json()["data"]["translations"][0]["translatedText"]



    def translate_bulk(self, texts: list[str], target_language: str) -> list[str]:
        # traducere toti tokenii intr-un singur apel API
        params = {
            "key": self._api_key,
            "source": "zh-CN",
            "target": target_language,
            "format": "text",
        }

        # Google Translate accepta mai multi parametri "q" in acelasi request
        response = requests.post(GOOGLE_TRANSLATE_URL, params=params, data={
            "q": texts
        })

        if response.status_code != 200:
            raise RuntimeError(f"Google Translate API error: {response.text}")

        translations = response.json()["data"]["translations"]
        return [t["translatedText"] for t in translations]
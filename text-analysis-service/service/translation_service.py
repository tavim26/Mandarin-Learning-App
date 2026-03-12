import requests

# endpoint REST al Google Translate API v2
GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2"


class TranslationService:

    def __init__(self, api_key: str):
        # cheia API este injectata din variabila de mediu la initializare
        self._api_key = api_key

    def translate(self, text: str, target_language: str) -> str:
        # sursa este intotdeauna chineza
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

        # structura raspunsului: data -> translations -> list -> translatedText
        return response.json()["data"]["translations"][0]["translatedText"]



    def translate_bulk(self, texts: list[str], target_language: str) -> list[str]:
        # parametrii comuni sunt trimisi ca query params
        params = {
            "key": self._api_key,
            "source": "zh-CN",
            "target": target_language,
            "format": "text",
        }

        # Google Translate accepta mai multi parametri "q" in acelasi request
        # trimiterea ca form data permite lista de stringuri fara serializare manuala
        response = requests.post(GOOGLE_TRANSLATE_URL, params=params, data={
            "q": texts
        })

        if response.status_code != 200:
            raise RuntimeError(f"Google Translate API error: {response.text}")

        # ordinea traducerilor in raspuns este garantata de API
        translations = response.json()["data"]["translations"]
        return [t["translatedText"] for t in translations]
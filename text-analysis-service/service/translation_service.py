import requests

GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2"


class TranslationException(Exception):
    """Exceptie ridicata cand Google Translate API este indisponibil sau returneaza eroare."""
    pass


class TranslationService:

    def __init__(self, api_key: str):
        if not api_key:
            raise RuntimeError(
                "GOOGLE_TRANSLATE_API_KEY nu este configurata. "
            )
        self._api_key = api_key



    def translate(self, text: str, target_language: str) -> str:
        params = {
            "key": self._api_key,
            "q": text,
            "source": "zh-CN",
            "target": target_language,
            "format": "text",
        }
        try:
            response = requests.post(GOOGLE_TRANSLATE_URL, params=params, timeout=10)
        except requests.exceptions.Timeout:
            raise TranslationException("Google Translate API did not respond within the allowed time.")
        except requests.exceptions.ConnectionError:
            raise TranslationException("Could not establish a connection to the Google Translate API.")

        if response.status_code != 200:
            raise TranslationException(
                f"Google Translate API returned error {response.status_code}: {response.text}"
            )

        try:
            return response.json()["data"]["translations"][0]["translatedText"]
        except (KeyError, IndexError) as e:
            raise TranslationException(f"Unexpected response from Google Translate API: {e}")



    def translate_bulk(self, texts: list[str], target_language: str) -> list[str]:

        if not texts:
            return []

        params = {
            "key": self._api_key,
            "source": "zh-CN",
            "target": target_language,
            "format": "text",
        }
        try:
            response = requests.post(
                GOOGLE_TRANSLATE_URL,
                params=params,
                data={"q": texts},
                timeout=10,
            )
        except requests.exceptions.Timeout:
            raise TranslationException("Google Translate API exceeded the allowed time.")
        except requests.exceptions.ConnectionError:
            raise TranslationException("Nu s-a putut stabili conexiunea cu Google Translate API.")

        if response.status_code != 200:
            raise TranslationException(
                f"Google Translate API returned error {response.status_code}: {response.text}"
            )

        try:
            translations = response.json()["data"]["translations"]
            return [t["translatedText"] for t in translations]
        except (KeyError, IndexError) as e:
            raise TranslationException(f"Unexpected answer from Google Translate API: {e}")
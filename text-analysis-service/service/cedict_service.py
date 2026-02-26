from pathlib import Path


# calea catre fisierul descarcat de la mdbg.net
CEDICT_PATH = Path(__file__).parent.parent / "resources" / "cedict.txt"


class CedictService:

    def __init__(self):
        # dictionarul principal: forma simplificata -> prima definitie in engleza
        self._dictionary: dict[str, str] = {}
        self._load()

    def _load(self) -> None:
        with open(CEDICT_PATH, encoding="utf-8") as f:
            for line in f:
                # liniile care incep cu # sunt comentarii de header
                if line.startswith("#"):
                    continue

                parsed = self._parse_line(line.strip())
                if parsed is not None:
                    simplified, translation = parsed
                    # nu suprascriem — prima intrare per cuvant este cea mai comuna
                    if simplified not in self._dictionary:
                        self._dictionary[simplified] = translation

    def _parse_line(self, line: str) -> tuple[str, str] | None:
        # format linie: "Traditional Simplified [pinyin] /def1/def2/"
        try:
            # separare dupa primul spatiu => traditional
            # al doilea token => simplified
            parts = line.split(" ")
            simplified = parts[1]

            # definitiile sunt intre primul si ultimul slash
            slash_start = line.index("/")
            definitions_raw = line[slash_start + 1:]
            first_definition = definitions_raw.split("/")[0]

            return simplified, first_definition
        except (ValueError, IndexError):
            return None

    def lookup(self, hanzi: str) -> str | None:
        return self._dictionary.get(hanzi)
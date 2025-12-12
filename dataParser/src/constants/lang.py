from typing import Literal

LANG = Literal["cmn-Hant", "en", "de", "ja", "ko", "ru", "es", "pt"]
ALL_LANG = Literal[
    "cmn-Hant", "en", "de", "es", "ja", "ko", "ru", "fr", "pt", "th", "zh-Hans"
]

CHINESE: LANG = "cmn-Hant"
ENGLISH: LANG = "en"
GERMAN: LANG = "de"
SPANISH: LANG = "es"
JAPANESE: LANG = "ja"
KOREAN: LANG = "ko"
RUSSIAN: LANG = "ru"
PORTUGUESE: LANG = "pt"
# Extra that are in game, but not used by EE2
FRENCH: ALL_LANG = "fr"
THAI: ALL_LANG = "th"
SIMPLIFIED_CHINESE: ALL_LANG = "zh-Hans"

LANGUAGES: set[LANG] = {
    ENGLISH,
    CHINESE,
    GERMAN,
    SPANISH,
    JAPANESE,
    KOREAN,
    RUSSIAN,
    PORTUGUESE,
}


LANGUAGES_NAMES: dict[ALL_LANG, str] = {
    ENGLISH: "English",
    CHINESE: "Traditional Chinese",
    GERMAN: "German",
    SPANISH: "Spanish",
    JAPANESE: "Japanese",
    KOREAN: "Korean",
    RUSSIAN: "Russian",
    FRENCH: "French",
    PORTUGUESE: "Portuguese",
    THAI: "Thai",
    SIMPLIFIED_CHINESE: "Simplified Chinese",
}

LANGUAGES_NAMES_TO_CODES: dict[str, ALL_LANG] = {
    v: k for k, v in LANGUAGES_NAMES.items()
}

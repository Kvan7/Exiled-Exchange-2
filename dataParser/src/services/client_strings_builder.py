import logging
from collections.abc import Sequence

from constants.client_string_data import (
    CLIENT_STRING_JS_FOOTER,
    CLIENT_STRING_JS_HEADER,
)
from constants.filenames import CLIENT_STRINGS
from constants.lang import LANG
from contracts.models.base_client_string import BaseClientString
from contracts.models.regex_client_string import RegexClientString
from models.array_client_string import ArrayClientString
from stores.game_store import GameStore

logger = logging.getLogger(__name__)


class ClientStringsBuilder:
    def __init__(self, lang: LANG):
        self.lang: LANG = lang
        game_store = GameStore(lang)
        client_strings_df = game_store.get(CLIENT_STRINGS).set_index("Id")  # pyright: ignore[reportUnknownMemberType]
        self.client_strings_lookup: dict[str, str] = client_strings_df["Text"].to_dict()  # pyright: ignore[reportUnknownMemberType]

    def use_game_store(self, poe_key: str) -> str:
        logger.debug(f"Using game store for {poe_key}")
        return self.client_strings_lookup[poe_key]

    def build(
        self,
        base_strings: Sequence[BaseClientString],
        array_strings: list[ArrayClientString],
        regex_strings: list[RegexClientString],
    ) -> str:
        logger.info("Building client strings")
        base = "\n".join(s.string(self.use_game_store, self.lang) for s in base_strings)
        logger.info("Finished base strings")
        arrays = "\n".join(
            s.string(self.use_game_store, self.lang) for s in array_strings
        )
        logger.info("Finished array strings")
        regexes = "\n".join(
            s.string(self.use_game_store, self.lang) for s in regex_strings
        )
        logger.info("Finished regex strings")
        format = [
            CLIENT_STRING_JS_HEADER.strip(),
            base,
            arrays,
            regexes,
            CLIENT_STRING_JS_FOOTER.strip(),
        ]
        logger.info("Joined strings")
        return "\n".join(format)

import logging
from typing import Callable, override

from constants.lang import LANG
from contracts.models.regex_client_string import RegexClientString

logger = logging.getLogger(__name__)


class ConstRegexClientString(RegexClientString):
    need_lookup: bool
    _my_key: str

    def __init__(self, key: str, output: str | dict[LANG, str]):
        self._my_key = key
        if isinstance(output, str):
            self.const: str = output
            self.need_lookup = False
        else:
            self.lookup: dict[LANG, str] = output
            self.need_lookup = True

    @property
    @override
    def my_key(self) -> str:
        return self._my_key

    @override
    def string(self, poe_key_lookup: Callable[[str], str], lang: LANG) -> str:
        logger.debug(self)
        value = self.value(poe_key_lookup, lang)
        return f"  // [Manual]\n  {self.my_key}: /^{value}$/,"

    @override
    def value(self, poe_key_lookup: Callable[[str], str], lang: LANG) -> str:
        val = self.const if not self.need_lookup else self.lookup[lang]
        val = val.replace("'", "\\'")
        return val

    @override
    def __repr__(self) -> str:
        return f"ConstRegexClientString(my_key={self.my_key}, const={self.const}, need_lookup={self.need_lookup})"

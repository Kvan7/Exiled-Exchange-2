import logging
from collections.abc import Sequence
from typing import Callable, override

from constants.lang import LANG
from contracts.models.base_client_string import BaseClientString

logger = logging.getLogger(__name__)


class ArrayClientString:
    def __init__(self, values: Sequence[BaseClientString]):
        if len(values) == 0:
            raise ValueError("ArrayClientString must have at least one value")
        if not all([v.my_key == values[0].my_key for v in values]):
            raise ValueError("All values must have the same key")
        self.my_key: str = values[0].my_key
        self.values: Sequence[BaseClientString] = values

    def string(self, poe_key_lookup: Callable[[str], str], lang: LANG) -> str:
        logger.debug(self)
        value = self.value(poe_key_lookup, lang)
        return f"  // [Array]\n  {self.my_key}: {value},"

    def value(self, poe_key_lookup: Callable[[str], str], lang: LANG) -> str:
        return (
            "["
            + ", ".join(f"'{v.value(poe_key_lookup, lang)}'" for v in self.values)
            + "]"
        )

    @override
    def __repr__(self) -> str:
        return f"ArrayClientString({self.my_key}, {'\n\t\t'.join(repr(v) for v in self.values)}\n\t)"

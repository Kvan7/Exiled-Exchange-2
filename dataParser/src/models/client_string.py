import logging
import re
from re import Pattern
from typing import Callable, override

from constants.lang import LANG
from contracts.models.base_client_string import BaseClientString

MAX_ITER = 25
logger = logging.getLogger(__name__)


class ClientString(BaseClientString):
    pattern_full: Pattern[str] = re.compile(r"\[([^\|\]]*?)\|([^\]]+)\]")
    _my_key: str

    def __init__(
        self,
        my_key: str,
        poe_keys: list[str],
        format: str | None = None,
        substring: list[
            tuple[int | Callable[[str], int], int | Callable[[str], int] | None] | None
        ]
        | None = None,
        keep_tooltip: bool = False,
        keep_format_option: bool = False,
        trim: bool = False,
    ):
        self._my_key = my_key
        self.poe_keys: list[str] = poe_keys
        self.format: str | None = format
        self.substring: (
            list[
                tuple[int | Callable[[str], int], int | Callable[[str], int] | None]
                | None
            ]
            | None
        ) = substring
        self.keep_tooltip: bool = keep_tooltip
        self.keep_format_option: bool = keep_format_option
        self.trim: bool = trim

    def apply(self, values: list[str]) -> str:
        if self.format is None:
            return "".join(values)
        return self.format.format(*values)

    @property
    @override
    def my_key(self) -> str:
        return self._my_key

    @override
    def string(self, poe_key_lookup: Callable[[str], str], lang: LANG) -> str:
        logger.debug(self)
        out_out = self.value(poe_key_lookup, lang)
        out_string = "\n".join(
            [
                # f"  // [{self.apply(self.poe_keys)}]",
                f"  {self.my_key}: '{out_out}',",
            ]
        )
        return out_string

    @override
    def value(self, poe_key_lookup: Callable[[str], str], lang: LANG) -> str:
        out_values = [poe_key_lookup(x) for x in self.poe_keys]

        out_values = [self.replace_gender_if_block(x) for x in out_values]

        if not self.keep_tooltip:
            out_values = [self.replace_tooltip_tags(x) for x in out_values]

        if not self.keep_format_option:
            out_values = [self.replace_format_things(x) for x in out_values]

        if self.substring is not None:
            out_values = [
                self.apply_substring(x, y) for x, y in zip(out_values, self.substring)
            ]

        out_out = self.apply(out_values)

        if self.trim:
            out_out = out_out.strip()

        out_out = out_out.replace("'", "\\'")

        return out_out

    def apply_substring(
        self,
        value: str,
        substring: tuple[int | Callable[[str], int], int | Callable[[str], int] | None]
        | None,
    ) -> str:
        if substring is None:
            return value

        if isinstance(substring[0], Callable):
            first = substring[0](value)
        else:
            first = substring[0]
        if substring[1] is None:
            return value[first:]
        if isinstance(substring[1], Callable):
            return value[first : substring[1](value)]
        return value[first : substring[1]]

    def replace_tooltip_tags(self, line: str) -> str:
        for _ in range(MAX_ITER):
            if not re.search(self.pattern_full, line):
                break
            line = re.sub(
                self.pattern_full,
                r"\2" if self.pattern_full.groups == 2 else r"\1",
                line,
            )
        else:
            raise RuntimeError(
                f"Exceeded max iterations for pattern: {self.pattern_full.pattern}"
            )
        return line.replace("[", "").replace("]", "")

    def replace_format_things(self, line: str) -> str:
        for _ in range(MAX_ITER):
            start = line.find("{")
            end = line.find("}")
            if start == -1 or end == -1:
                break

            line = line[:start] + line[end + 1 :]
        else:
            raise RuntimeError(
                f"Exceeded max iterations for pattern: {self.pattern_full.pattern}"
            )
        return line

    @override
    def __repr__(self) -> str:
        return f"ClientString(my_key={self.my_key}, poe_keys={self.poe_keys}, format={self.format},\n\t\t substring={self.substring}, keep_tooltip={self.keep_tooltip}, keep_format_option={self.keep_format_option},\n\t\t trim={self.trim})"

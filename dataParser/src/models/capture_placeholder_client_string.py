import logging
import re
from re import Pattern
from typing import Callable, override

from constants.lang import LANG
from contracts.models.regex_client_string import RegexClientString
from models.client_string import ClientString

logger = logging.getLogger(__name__)


class CapturePlaceholderClientString(ClientString, RegexClientString):
    format_pattern: Pattern[str] = re.compile(r"\{\d*\}")
    capture_str: str = "(.*)"

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
        capture_str: str = "(.*)",
    ):
        super().__init__(
            my_key,
            poe_keys,
            format,
            substring,
            keep_tooltip,
            keep_format_option,
            trim,
        )
        self.capture_str = capture_str

    @override
    def string(self, poe_key_lookup: Callable[[str], str], lang: LANG) -> str:
        logger.debug(self)
        out_out = self.value(poe_key_lookup, lang)
        out_string = "\n".join(
            [
                # f"  // [{self.apply(self.poe_keys)}]",
                f"  {self.my_key}: /^{out_out}$/,",
            ]
        )
        return out_string

    @override
    def replace_format_things(self, line: str) -> str:
        line = line.replace("(", "\\(").replace(")", "\\)")
        line = re.sub(self.format_pattern, self.capture_str, line)
        line = super().replace_format_things(line)
        return line

    @override
    def __repr__(self) -> str:
        return f"CapturePlaceholderClientString(my_key={self.my_key}, poe_keys={self.poe_keys}, format={self.format},\n\t\t substring={self.substring}, keep_tooltip={self.keep_tooltip}, keep_format_option={self.keep_format_option},\n\t\t trim={self.trim}, capture_str={self.capture_str})"

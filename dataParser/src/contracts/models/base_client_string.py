import re
from abc import ABC, abstractmethod
from typing import Callable

from constants.lang import LANG
from constants.other import GENDER_CLIENT_STRINGS_ORDER


class BaseClientString(ABC):
    gender_pattern: re.Pattern[str] = re.compile(
        r"<([efils]*):?(?P<gender>.{1,2})?>\{{1,2}(?P<key>[^{}]*)\}{1,2}"
    )
    sub_gender_pattern: re.Pattern[str] = re.compile(r"<.*\{{1,2}[^{}0]+\}{1,2}")

    @property
    @abstractmethod
    def my_key(self) -> str:
        raise NotImplementedError()

    @abstractmethod
    def string(self, poe_key_lookup: Callable[[str], str], lang: LANG) -> str:
        raise NotImplementedError()

    @abstractmethod
    def value(self, poe_key_lookup: Callable[[str], str], lang: LANG) -> str:
        raise NotImplementedError()

    def replace_gender_if_block(self, line: str) -> str:
        if self.gender_pattern.search(line) is None:
            return line

        genders: dict[str, str] = {}
        for m in self.gender_pattern.finditer(line):
            if m.group("gender") is None:
                genders["ANY"] = m.group("key")
                continue
            genders[m.group("gender")] = m.group("key")

        for gender in GENDER_CLIENT_STRINGS_ORDER:
            if gender in genders:
                return self.sub_gender_pattern.sub(genders[gender], line)
        return line

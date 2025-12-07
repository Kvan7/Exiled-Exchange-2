from abc import ABC, abstractmethod
from typing import Callable

from constants.lang import LANG


class RegexClientString(ABC):
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

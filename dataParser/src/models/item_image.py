# pyright: basic

import copy
from typing import Literal

UNIQUE_FILTER = {"type_filters": {"filters": {"rarity": {"option": "unique"}}}}
NONUNIQUE_FILTER = {"type_filters": {"filters": {"rarity": {"option": "nonunique"}}}}
BASE_PAYLOAD: dict[
    str, dict[str, dict[str, str] | list[dict[str, str | list[str]]]] | dict[str, str]
] = {
    "query": {
        "status": {"option": "any"},
        "stats": [{"type": "and", "filters": []}],
    },
    "sort": {"price": "asc"},
}


class ItemImage:
    def __init__(
        self,
        name: str,
        namespace: Literal["UNIQUE", "ITEM", "GEM"],
        unique: dict[str, str] | None = None,
    ):
        self.name = name
        self.namespace = namespace
        if namespace == "UNIQUE":
            assert unique is not None
            assert unique.get("base") is not None
            self.base = unique.get("base")
        else:
            self.base = name

    def __str__(self):
        return f"{self.name} ({self.namespace})"

    def __repr__(self):
        return f"{self.name} ({self.namespace})"

    def __eq__(self, other):
        if not isinstance(other, ItemImage):
            return False
        return self.name == other.name and self.namespace == other.namespace

    def __hash__(self):
        return hash((self.name, self.namespace))

    def search_payload(self):
        assert self.base is not None
        payload = copy.deepcopy(BASE_PAYLOAD)
        if self.namespace == "UNIQUE":
            payload["query"]["filters"] = UNIQUE_FILTER
            payload["query"]["type"] = self.base
            payload["query"]["name"] = self.name
        else:
            payload["query"]["filters"] = NONUNIQUE_FILTER
            payload["query"]["type"] = self.name
        return payload

    def save_name(self) -> str:
        return f"{self.namespace}={self.name}"

import copy
import json
import logging
import os
from typing import Literal, Optional

from rateLimiter import RateLimiter, set_log_level
from tqdm import tqdm

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)
UNIQUE_FILTER = {"type_filters": {"filters": {"rarity": {"option": "unique"}}}}
NONUNIQUE_FILTER = {"type_filters": {"filters": {"rarity": {"option": "nonunique"}}}}
BASE_PAYLOAD = {
    "query": {
        "status": {"option": "any"},
        "stats": [{"type": "and", "filters": []}],
    },
    "sort": {"price": "asc"},
}
SEARCH_URL = "http://www.pathofexile.com/api/trade2/search/Standard/"
SEARCH_HEADERS = {"content-type": "application/json"}
FETCH_URL = "https://www.pathofexile.com/api/trade2/fetch/"


class Item:
    def __init__(
        self,
        refName: str,
        namespace: Literal["UNIQUE", "ITEM", "GEM"],
        unique: Optional[dict[str, str]] = None,
    ):
        self.refName = refName
        self.namespace = namespace
        if namespace == "UNIQUE":
            assert unique is not None
            assert unique.get("base") is not None
            self.base = unique.get("base")
        else:
            self.base = refName

    def __str__(self):
        return f"{self.refName} ({self.namespace})"

    def __repr__(self):
        return f"{self.refName} ({self.namespace})"

    def __eq__(self, other):
        if not isinstance(other, Item):
            return False
        return self.refName == other.refName and self.namespace == other.namespace

    def __hash__(self):
        return hash((self.refName, self.namespace))

    def search_payload(self) -> dict:
        assert self.base is not None
        payload = copy.deepcopy(BASE_PAYLOAD)
        if self.namespace == "UNIQUE":
            payload["query"]["filters"] = UNIQUE_FILTER
            payload["query"]["type"] = self.base
            payload["query"]["name"] = self.refName
        else:
            payload["query"]["filters"] = NONUNIQUE_FILTER
            payload["query"]["type"] = self.refName
        return payload

    def save_name(self) -> str:
        return f"{self.namespace}={self.refName}"


def get_script_dir() -> str:
    """Returns the directory where the script is located."""
    return os.path.dirname(os.path.realpath(__file__))


def get_items() -> list[dict[str, str]]:
    with open(f"{get_script_dir()}/en/items.ndjson", "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f.readlines()]


def convert_item(item: dict[str, str]) -> Item:
    return Item(item.get("refName"), item.get("namespace"), item.get("unique"))


def convert_items(items: list[dict[str, str]]) -> list[Item]:
    return [convert_item(item) for item in items]


def get_fetch_id(item: Item, net: RateLimiter) -> str | None:
    payload = item.search_payload()
    for attempt in range(3):
        result = net.post(SEARCH_URL, payload=payload, headers=SEARCH_HEADERS)
        if result.status_code == 200:
            data = result.json()
            if data.get("result"):
                if len(data.get("result")):
                    return data.get("result")[0]
                else:
                    return None
        elif result.status_code != 429:
            logger.error(f"Unexpected status code: {result.status_code}")
            raise Exception(
                f"Unexpected status code: {result.status_code}\n {result.text}"
            )
    raise Exception(f"Retry limit exceeded for {item.refName}")


def get_image_url(item: Item, net: RateLimiter) -> str | None:
    fetch_id = get_fetch_id(item, net)
    if fetch_id is None:
        return None


def main():
    net = RateLimiter()
    raw_items = get_items()
    items = convert_items(raw_items)

    for item in tqdm(items):
        image_url = get_image_url(item, net)


if __name__ == "__main__":
    set_log_level(logging.WARNING)
    main()

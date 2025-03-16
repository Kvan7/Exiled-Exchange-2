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
SEARCH_URL = "https://www.pathofexile.com/api/trade2/search/Standard"
SEARCH_HEADERS = {"content-type": "application/json"}
FETCH_URL = "https://www.pathofexile.com/api/trade2/fetch/"
NOT_FOUND = "%NOT_FOUND%"


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


def get_cache() -> dict[str, str]:
    cache_path = f"{get_script_dir()}/itemImageCache.json"

    # Check if the file exists and create it if it doesn't
    if not os.path.exists(cache_path):
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump({}, f)

    # Read and return the contents of the file
    with open(cache_path, "r", encoding="utf-8") as f:
        return json.loads(f.read())


def save_cache(cache: dict[str, str], output_file: str = "itemImageCache.json"):
    cache_path = f"{get_script_dir()}/{output_file}"
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(cache, f)


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
            if data.get("result") and len(data.get("result")) > 0:
                return data.get("result")[0]
            else:
                logger.debug(f"No results for {item.refName}")
                return None
        elif result.status_code != 429:
            logger.error(f"Unexpected status code: {result.status_code}")
            raise Exception(
                f"Unexpected status code: {result.status_code}\n {result.text}"
            )
    raise Exception(f"Retry limit exceeded for {item.refName}")


def fetch_listing(fetch_id: str, net: RateLimiter) -> dict | None:
    for attempt in range(3):
        result = net.get(FETCH_URL + fetch_id)
        if result.status_code == 200:
            data = result.json()
            if data.get("result") and len(data.get("result")) > 0:
                return data.get("result")[0]
            else:
                return None
        elif result.status_code != 429:
            logger.error(f"Unexpected status code: {result.status_code}")
            raise Exception(
                f"Unexpected status code: {result.status_code}\n {result.text}"
            )
    raise Exception(f"Retry limit exceeded for {fetch_id}")


def parse_listing_for_url(listing: dict) -> str | None:
    item = listing.get("item")
    if item is None:
        return None
    icon_url = item.get("icon")
    if icon_url is None:
        return None
    if not icon_url.startswith(
        "https://web.poecdn.com/gen/image"
    ) or not icon_url.endswith(".png"):
        raise Exception(f"Unexpected icon url: {icon_url}")
    return icon_url


def get_image_url(item: Item, net: RateLimiter) -> str | None:
    fetch_id = get_fetch_id(item, net)
    if fetch_id is None:
        logger.warning(f"No items found for {item.refName}")
        return None
    listing = fetch_listing(fetch_id, net)
    if listing is None:
        logger.warning(f"Listing missing for {item.refName} | {fetch_id}")
        return None
    icon_url = parse_listing_for_url(listing)
    if icon_url is None:
        logger.warning(f"Icon missing for {item.refName} | {fetch_id}")
        return None
    return icon_url


def main(try_missing=False, debug=False):
    net = RateLimiter(debug=debug)
    raw_items = get_items()
    items = convert_items(raw_items)

    cache = get_cache()
    # backup old cache
    save_cache(cache, output_file="itemImageCache.old.json")

    filtered_items = [
        item
        for item in items
        if not (
            item.save_name() in cache
            and (not try_missing or cache[item.save_name()] != NOT_FOUND)
        )
    ]

    for index, item in tqdm(enumerate(filtered_items)):
        # if item.save_name() in cache:
        #     logger.info(f"{item.save_name()}\t{cache[item.save_name()]}")
        #     saved_url = cache[item.save_name()]
        #     if not try_missing or saved_url != NOT_FOUND:
        #         continue
        image_url = get_image_url(item, net)
        if image_url is not None:
            logger.info(f"{item.save_name()}\t{image_url}")
            cache[item.save_name()] = image_url
        else:
            logger.info(f"{item.save_name()}\t{NOT_FOUND}")
            cache[item.save_name()] = NOT_FOUND

        save_cache(cache)


if __name__ == "__main__":
    set_log_level(logging.WARNING)
    main(try_missing=False, debug=False)

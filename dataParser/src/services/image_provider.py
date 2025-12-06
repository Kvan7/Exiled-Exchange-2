import json
import logging
import os
from math import nan
from typing import Literal

import numpy as np
import pandas as pd
from tqdm import tqdm

from constants.filenames import ITEM_IMAGE_CACHE, OLD_ITEM_IMAGE_CACHE
from models.item_image import ItemImage
from services.rate_limiter import RateLimiter

tqdm.pandas()

MODE = Literal["noLookup", "missing", "new", "all"]

logger = logging.getLogger(__name__)

SEARCH_URL = "https://www.pathofexile.com/api/trade2/search/Rise%20of%20the%20Abyssal"
SEARCH_HEADERS = {"content-type": "application/json"}
FETCH_URL = "https://www.pathofexile.com/api/trade2/fetch/"
NOT_FOUND = "%NOT_FOUND%"


def get_script_dir() -> str:
    """Returns the directory where the script is located."""
    return os.path.dirname(os.path.realpath(__file__))


class ImageProvider:
    def __init__(self, mode: MODE):
        self.mode: MODE = mode
        self.net: RateLimiter = RateLimiter(debug=False)

        self.cache: dict[str, str] = self.get_cache()

        # backup prior cache
        self.save_cache(self.cache, output_file=OLD_ITEM_IMAGE_CACHE)

    def get_cache(self) -> dict[str, str]:
        cache_path = f"{get_script_dir()}/{ITEM_IMAGE_CACHE}"

        # Check if the file exists and create it if it doesn't
        if not os.path.exists(cache_path):
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump({}, f)

        # Read and return the contents of the file
        with open(cache_path, "r", encoding="utf-8") as f:
            return json.loads(f.read())

    def save_cache(self, cache: dict[str, str], output_file: str = ITEM_IMAGE_CACHE):
        cache_path = f"{get_script_dir()}/{output_file}"
        logger.info(f"Saving cache to {cache_path}")
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=4)

    def apply_images(self, items: pd.DataFrame) -> pd.DataFrame:
        item_images = items.copy()
        item_images["icon"] = item_images.progress_apply(self.get_image, axis=1)  # pyright:ignore [reportUnknownMemberType, reportCallIssue]
        self.save_cache(self.cache)
        return item_images

    def get_image(self, row: pd.Series) -> str:
        item = ItemImage(row["refName"], row["namespace"], row["unique"])
        save_name = item.save_name()
        image_url = NOT_FOUND
        if self.mode == "noLookup":
            return NOT_FOUND if save_name not in self.cache else self.cache[save_name]

        if (
            self.mode == "all"
            or save_name
            not in self.cache  # mode = new (or missing and it isn't in cache)
            or (self.mode == "missing" and self.cache[save_name] == NOT_FOUND)
        ):
            image_url = self.get_image_url(item)
            self.cache[save_name] = image_url if image_url is not None else NOT_FOUND
        elif save_name in self.cache:
            image_url = self.cache[save_name]
        return image_url if image_url is not None else NOT_FOUND

    def get_fetch_id(self, item: ItemImage) -> str | None:
        payload = item.search_payload()
        for _ in range(3):
            result = self.net.post(SEARCH_URL, payload=payload, headers=SEARCH_HEADERS)  # pyright:ignore [reportArgumentType]
            if result.status_code == 200:
                data = result.json()
                if data.get("result") and len(data.get("result")) > 0:
                    return data.get("result")[0]
                else:
                    return None
            elif result.status_code != 429:
                raise Exception(
                    f"Unexpected status code: {result.status_code}\n {result.text}"
                )
        raise Exception(f"Retry limit exceeded for {item.name}")

    def fetch_listing(self, fetch_id: str):
        for _ in range(3):
            result = self.net.get(FETCH_URL + fetch_id)
            if result.status_code == 200:
                data = result.json()
                if data.get("result") and len(data.get("result")) > 0:
                    return data.get("result")[0]
                else:
                    return None
            elif result.status_code != 429:
                raise Exception(
                    f"Unexpected status code: {result.status_code}\n {result.text}"
                )
        raise Exception(f"Retry limit exceeded for {fetch_id}")

    def parse_listing_for_url(self, listing) -> str | None:
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

    def get_image_url(self, item: ItemImage) -> str | None:
        fetch_id = self.get_fetch_id(item)
        if fetch_id is None:
            return None
        listing = self.fetch_listing(fetch_id)
        if listing is None:
            return None
        icon_url = self.parse_listing_for_url(listing)
        if icon_url is None:
            return None
        return icon_url

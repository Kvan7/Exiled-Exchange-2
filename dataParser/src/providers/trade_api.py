"""
Retrieves all data that is sourced from the trade site
"""

import json
import logging
import os

import cloudscraper

from constants.lang import LANG
from constants.urls import LANG_URLS, TRADE_QUERY_URLS


class TradeApiProvider:
    def __init__(self, lang: LANG):
        self.lang: LANG = lang
        self.session: cloudscraper.CloudScraper = cloudscraper.create_scraper(  # pyright:ignore [reportAny]
            interpreter="nodejs"
        )
        self.output_dir: str = os.path.join(
            os.path.dirname(__file__), "../../data/json", self.lang
        )

    def pull(self):
        base_url = LANG_URLS[self.lang]

        for relative_url in TRADE_QUERY_URLS:
            # Construct the full URL
            url = f"{base_url}{relative_url}"

            # Extract the filename from the relative URL
            filename = os.path.basename(relative_url)

            logging.info(f"Fetching JSON from: {url} for language: {self.lang}")

            # Fetch the JSON data
            response = self.session.get(url)

            if response.status_code == 200:
                output_path = os.path.join(self.output_dir, f"{filename}.json")
                with open(output_path, "w", encoding="utf-8") as file:
                    json.dump(response.json(), file, ensure_ascii=False, indent=4)
                logging.info(f"Saved JSON to: {output_path}")
            else:
                logging.error(
                    f"Failed to fetch JSON from: {url}, code: {response.status_code}"
                )

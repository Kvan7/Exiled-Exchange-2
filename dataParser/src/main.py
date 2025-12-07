import argparse
import json
import logging
import shutil

from tqdm import tqdm

from constants.client_string_data import (
    CLIENT_STRING_ARRAYS,
    CLIENT_STRING_KEY_VALUES,
    CLIENT_STRING_REGEX,
)
from constants.lang import ENGLISH, LANG, LANGUAGES
from providers.game_api import GameDataProvider
from providers.trade_api import TradeApiProvider
from services.client_strings_builder import ClientStringsBuilder
from services.image_provider import MODE
from services.nd_builder_service import NdBuilderService

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def main(**kwargs: dict[str, bool | str]):
    pull: bool = kwargs.get("pull", False)  # pyright: ignore[reportAssignmentType]
    image_mode: MODE = kwargs.get("image_mode", "new")  # pyright: ignore[reportAssignmentType]
    push: bool = kwargs.get("push", False)  # pyright: ignore[reportAssignmentType]
    main_repo_path: str = kwargs.get("main_repo_path", "../exiled-exchange-2")  # pyright: ignore[reportAssignmentType]

    if pull:
        GameDataProvider().run_export()
        for lang in tqdm(LANGUAGES):
            TradeApiProvider(lang).pull()

    run_on: list[LANG] = [ENGLISH, *[lang for lang in LANGUAGES if lang != ENGLISH]]

    for index, lang in enumerate(run_on):
        logger.info(
            "================================================================================"
        )
        logger.info(f"Building {lang}: {index + 1}/{len(LANGUAGES)}")
        logger.info(
            "================================================================================"
        )
        nd = NdBuilderService(lang, image_mode if lang is ENGLISH else "new")

        stats = nd.build_stats_ndjson()
        stats_o = stats.where(stats.notna(), None)
        with open(f"output/{lang}/stats.ndjson", "w", encoding="utf-8") as f:
            for _, row in stats_o.iterrows():
                obj = {k: v for k, v in row.items() if v is not None}
                f.write(f"{json.dumps(obj, ensure_ascii=False)}\n")

        items = nd.build_items_ndjson()
        items_o = items.where(items.notna(), None)
        with open(f"output/{lang}/items.ndjson", "w", encoding="utf-8") as f:
            for _, row in items_o.iterrows():
                obj = {k: v for k, v in row.items() if v is not None}
                try:
                    f.write(f"{json.dumps(obj, ensure_ascii=False)}\n")
                except Exception as e:
                    print(e)
                    print(obj)
                    raise

        client_strings_builder = ClientStringsBuilder(lang)
        client_strings_js = client_strings_builder.build(
            base_strings=CLIENT_STRING_KEY_VALUES,
            array_strings=CLIENT_STRING_ARRAYS,
            regex_strings=CLIENT_STRING_REGEX,
        )
        with open(f"output/{lang}/client_strings.js", "w", encoding="utf-8") as f:
            try:
                f.write(client_strings_js)
            except Exception as e:
                print(e)
                print(client_strings_js)
                raise

        # Copy files to EE2 repo
        if push:
            logger.info("Copying files to EE2 repo")
            _ = shutil.copy(
                f"output/{lang}/stats.ndjson",
                f"{main_repo_path}/renderer/public/data/{lang}/stats.ndjson",
            )
            _ = shutil.copy(
                f"output/{lang}/items.ndjson",
                f"{main_repo_path}/renderer/public/data/{lang}/items.ndjson",
            )
            _ = shutil.copy(
                f"output/{lang}/client_strings.js",
                f"{main_repo_path}/renderer/public/data/{lang}/client_strings.js",
            )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    _ = parser.add_argument("--pull", action="store_true", help="Pull trade data")
    _ = parser.add_argument(
        "--log", default="info", help="Log level (debug, info, warn, error)"
    )
    _ = parser.add_argument(
        "--image-mode",
        default="new",
        choices=["noLookup", "missing", "new", "all"],
        help="Image mode (noLookup, missing, new, all)",
    )
    _ = parser.add_argument(
        "--push",
        action="store_true",
        help="Push to EE2 repo",
    )
    _ = parser.add_argument(
        "--main-repo-path",
        default="../exiled-exchange-2",
        help="Path to main repo",
    )

    args = parser.parse_args()

    logging.getLogger().setLevel(args.log.upper())  # pyright:ignore [reportAny]
    main(**vars(args))  # pyright:ignore [reportAny]

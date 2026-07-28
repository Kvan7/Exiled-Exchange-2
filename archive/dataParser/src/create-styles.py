import argparse
import logging
import shutil

from constants.css import CSS_DEFAULT, CSS_USER_STYLE_VARS
from constants.css_rules import (
    COMPACT_TAG_ONLY_RULES,
    OPINIONATED_RULES,
    TAG_ONLY_RULES,
)
from constants.my_css import MY_CSS_DEFAULT, MY_CSS_USER_STYLE_VARS
from models.user_style_model import UserStyleModel
from services.tagged_stats import TaggedStats
from services.userstyles_builder import UserStylesBuilder

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

CURRENT_VERSION = "1.0.12"

STYLES_TO_BUILD = [
    (
        TAG_ONLY_RULES,
        UserStyleModel(
            "Raw Tag Based",
            "In game tag based highlighting with no filtering",
            "tagOnly",
            CURRENT_VERSION,
            CSS_USER_STYLE_VARS,
            CSS_DEFAULT,
        ),
    ),
    (
        COMPACT_TAG_ONLY_RULES,
        UserStyleModel(
            "Raw Tag Based (Compact)",
            "In game tag based highlighting with no filtering, applied only in compact view",
            "tagOnlyCompact",
            CURRENT_VERSION,
            CSS_USER_STYLE_VARS,
            CSS_DEFAULT,
        ),
    ),
    (
        OPINIONATED_RULES,
        UserStyleModel(
            "Kvan7's CSS",
            "Rules based on in game tags, but with some custom rules that I like",
            "kvanRules",
            CURRENT_VERSION,
            MY_CSS_USER_STYLE_VARS,
            CSS_DEFAULT + MY_CSS_DEFAULT,
        ),
    ),
]


def main(**kwargs: dict[str, bool | str]):
    _ = kwargs
    logger.info(f"Current version: {CURRENT_VERSION}")

    tagged_stats = TaggedStats()
    tagged_df = tagged_stats.run()

    logger.info(f"Building {len(STYLES_TO_BUILD)} styles")
    for css_rules, user_style in STYLES_TO_BUILD:
        logger.info(f"Building {user_style.filename}")
        user_styles = UserStylesBuilder(tagged_df, css_rules, user_style)
        with open(
            f"output/css/{user_style.filename}.user.css", "w", encoding="utf-8"
        ) as f:
            _ = f.write(user_styles.build())
            logger.info(f"Saved to {user_style.filename}.user.css")

        logger.info(f"Copying {user_style.filename}.user.css to gist repo")
        _ = shutil.copy(
            f"output/css/{user_style.filename}.user.css",
            f"../gist-trade-highlight/{user_style.filename}.user.css",
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    _ = parser.add_argument(
        "--log", default="info", help="Log level (debug, info, warn, error)"
    )

    args = parser.parse_args()

    logging.getLogger().setLevel(args.log.upper())  # pyright:ignore [reportAny]
    main(**vars(args))  # pyright:ignore [reportAny]
